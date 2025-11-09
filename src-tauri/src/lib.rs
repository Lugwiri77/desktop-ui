use serde::{Deserialize, Serialize};

// Request structure matching backend's LoginRequest
#[derive(Debug, Serialize, Deserialize)]
struct LoginRequest {
    email_or_username: String,
    password: String,
    #[serde(default = "default_client_type")]
    client_type: String,
}

fn default_client_type() -> String {
    "desktop".to_string()
}

// Response structure matching backend's LoginResponse
#[derive(Debug, Serialize, Deserialize)]
struct LoginResponse {
    status: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<TokensResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TokensResponse {
    message: String,
    username: String,
    email: String,
    access_token: String,
    refresh_token: String,
    user_role: serde_json::Value,  // Accept any JSON for user_role
    organization_type: Option<String>,
    phone_number: String,
    tax_identification_number: Option<String>,
    profile_pic_url: Option<String>,
    logo_url: Option<String>,
    staff_role: Option<String>,
    department: Option<String>,
}

// Simplified response for frontend
#[derive(Debug, Serialize, Deserialize)]
struct AuthResponse {
    success: bool,
    token: Option<String>,
    refresh_token: Option<String>,
    message: String,
    username: Option<String>,
    email: Option<String>,
    profile_pic_url: Option<String>,
    logo_url: Option<String>,
    organization_name: Option<String>,
    user_role: Option<serde_json::Value>,
    organization_type: Option<String>,
    tax_identification_number: Option<String>,
    staff_role: Option<String>,
    department: Option<String>,
}

// Tauri command to authenticate user with Kastaem backend
#[tauri::command]
async fn authenticate_user(email: String, password: String) -> Result<AuthResponse, String> {
    let backend_url = "http://127.0.0.1:8000/auth/login";

    let client = reqwest::Client::new();
    let auth_data = LoginRequest {
        email_or_username: email,
        password,
        client_type: "desktop".to_string(),
    };

    match client
        .post(backend_url)
        .header("X-Client-Type", "desktop")
        .header("Content-Type", "application/json")
        .json(&auth_data)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                // First get the raw text to see what we're receiving
                let response_text = match response.text().await {
                    Ok(text) => text,
                    Err(e) => return Err(format!("Failed to read response: {}", e)),
                };

                // Log the response for debugging
                println!("Backend response: {}", response_text);

                // Try to parse as JSON Value first
                let json_value: serde_json::Value = match serde_json::from_str(&response_text) {
                    Ok(v) => v,
                    Err(e) => return Err(format!("Failed to parse JSON: {}. Response was: {}", e, response_text)),
                };

                // The backend returns TokensResponse directly for desktop/mobile
                // Extract fields directly from the root object
                let access_token = json_value.get("access_token")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                let refresh_token = json_value.get("refresh_token")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                let username = json_value.get("username")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let email = json_value.get("email")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let message = json_value.get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Login successful")
                    .to_string();

                let profile_pic_url = json_value.get("profile_pic_url")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let logo_url = json_value.get("logo_url")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let organization_name = json_value.get("organization_name")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let user_role = json_value.get("user_role").cloned();

                let organization_type = json_value.get("organization_type")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let tax_identification_number = json_value.get("tax_identification_number")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let staff_role = json_value.get("staff_role")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let department = json_value.get("department")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                // Check if we got valid tokens
                if access_token.is_empty() {
                    return Err("No access token in response".to_string());
                }

                Ok(AuthResponse {
                    success: true,
                    token: Some(access_token),
                    refresh_token: Some(refresh_token),
                    message,
                    username,
                    email,
                    profile_pic_url,
                    logo_url,
                    organization_name,
                    user_role,
                    organization_type,
                    tax_identification_number,
                    staff_role,
                    department,
                })
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());

                // Try to parse the error JSON to extract a user-friendly message
                if let Ok(error_json) = serde_json::from_str::<serde_json::Value>(&error_text) {
                    // Check for specific error messages
                    if let Some(error_msg) = error_json.get("error").and_then(|v| v.as_str()) {
                        let user_friendly_message = match error_msg {
                            "Account not found" => "Account not found. Please check your email address.",
                            "Invalid password" => "Invalid password. Please try again.",
                            "Invalid credentials" => "Invalid email or password. Please try again.",
                            _ => error_msg
                        };
                        return Err(user_friendly_message.to_string());
                    }

                    // Fallback to message field if error field doesn't exist
                    if let Some(msg) = error_json.get("message").and_then(|v| v.as_str()) {
                        return Err(msg.to_string());
                    }
                }

                // If we can't parse the JSON, return a generic message based on status code
                let generic_message = match status.as_u16() {
                    401 => "Invalid email or password. Please try again.",
                    403 => "Access denied. Your account may not have permission to use this application.",
                    404 => "Account not found. Please check your email address.",
                    500 => "Server error. Please try again later.",
                    _ => "Login failed. Please try again."
                };

                Err(generic_message.to_string())
            }
        }
        Err(e) => Err(format!("Connection failed: {}. Make sure backend is running on http://127.0.0.1:8000", e)),
    }
}

// Tauri command for making authenticated API calls
#[tauri::command]
async fn authenticated_request(
    url: String,
    method: String,
    token: String,
    body: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let mut request = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };

    // Add required headers for desktop client
    request = request
        .header("Authorization", format!("Bearer {}", token))
        .header("X-Client-Type", "desktop")
        .header("Content-Type", "application/json");

    // Add body if provided
    if let Some(body_str) = body {
        request = request.body(body_str);
    }

    match request.send().await {
        Ok(response) => {
            let status = response.status();
            let text = response.text().await.unwrap_or_else(|_| "Failed to read response".to_string());

            if status.is_success() {
                Ok(text)
            } else {
                Err(format!("Request failed ({}): {}", status, text))
            }
        }
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}

// Tauri command for logout
#[tauri::command]
async fn logout_user(token: String) -> Result<String, String> {
    let backend_url = "http://127.0.0.1:8000/auth/logout";

    let client = reqwest::Client::new();

    match client
        .post(backend_url)
        .header("Authorization", format!("Bearer {}", token))
        .header("X-Client-Type", "desktop")
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                Ok("Logged out successfully".to_string())
            } else {
                Err("Logout failed".to_string())
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      authenticate_user,
      authenticated_request,
      logout_user
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
