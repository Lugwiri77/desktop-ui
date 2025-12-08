#!/usr/bin/env node

/**
 * Migration Script for Offline-First Mutations
 *
 * Scans the codebase for useMutation calls and generates migration code
 * to convert them to useOfflineMutation with offline support.
 *
 * Usage:
 *   node scripts/migrate-to-offline.js [path]
 *   node scripts/migrate-to-offline.js app/dashboard/visitor
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_SCAN_PATH = 'app/dashboard';
const EXCLUDED_DIRS = ['node_modules', '.next', 'dist', 'build'];

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Recursively find all TypeScript/TSX files
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Detect useMutation calls in file content
 */
function detectUseMutations(filePath, content) {
  const mutations = [];

  // Pattern to match useMutation({ ... })
  const mutationRegex = /const\s+(\w+)\s*=\s*useMutation\s*\({([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*\)/g;

  let match;
  while ((match = mutationRegex.exec(content)) !== null) {
    const varName = match[1];
    const options = match[2];

    // Extract mutationFn
    const fnMatch = options.match(/mutationFn:\s*([^,\n]+)/);
    const mutationFn = fnMatch ? fnMatch[1].trim() : 'unknownFunction';

    // Extract onSuccess
    const hasOnSuccess = options.includes('onSuccess');

    // Extract onError
    const hasOnError = options.includes('onError');

    // Extract invalidate queries
    const invalidateMatch = options.match(/queryClient\.invalidateQueries\(\{\s*queryKey:\s*\[['"]([^'"]+)['"]\]/g);
    const invalidateKeys = [];
    if (invalidateMatch) {
      invalidateMatch.forEach(m => {
        const keyMatch = m.match(/queryKey:\s*\[['"]([^'"]+)['"]\]/);
        if (keyMatch) invalidateKeys.push(keyMatch[1]);
      });
    }

    mutations.push({
      varName,
      mutationFn,
      hasOnSuccess,
      hasOnError,
      invalidateKeys,
      lineNumber: content.substring(0, match.index).split('\n').length,
    });
  }

  return mutations;
}

/**
 * Infer module name from file path
 */
function inferModuleName(filePath) {
  if (filePath.includes('/real-estate/')) return 'real-estate';
  if (filePath.includes('/visitor/') || filePath.includes('/security/')) return 'visitor';
  if (filePath.includes('/education/')) return 'education';
  if (filePath.includes('/staff/')) return 'staff';
  return 'unknown';
}

/**
 * Infer operation name from mutation function
 */
function inferOperationName(mutationFn, varName) {
  // Try to extract from function name
  if (mutationFn.match(/create/i)) return mutationFn.replace(/create/i, 'create');
  if (mutationFn.match(/update/i)) return mutationFn.replace(/update/i, 'update');
  if (mutationFn.match(/delete/i)) return mutationFn.replace(/delete/i, 'delete');
  if (mutationFn.match(/register/i)) return mutationFn.replace(/register/i, 'register');
  if (mutationFn.match(/assign/i)) return mutationFn.replace(/assign/i, 'assign');
  if (mutationFn.match(/release/i)) return mutationFn.replace(/release/i, 'release');

  // Fallback to variable name
  return varName.replace(/Mutation$/, '');
}

/**
 * Infer priority from operation type
 */
function inferPriority(operationName) {
  const highPriorityOps = ['create', 'register', 'checkin', 'checkout', 'assign', 'release'];
  const lowPriorityOps = ['bulk', 'cleanup', 'analytics'];

  const opLower = operationName.toLowerCase();

  if (highPriorityOps.some(op => opLower.includes(op))) return 'high';
  if (lowPriorityOps.some(op => opLower.includes(op))) return 'low';

  return 'normal';
}

/**
 * Generate migration code for a mutation
 */
function generateMigrationCode(mutation, moduleName) {
  const operationName = inferOperationName(mutation.mutationFn, mutation.varName);
  const priority = inferPriority(operationName);
  const invalidateKeysStr = mutation.invalidateKeys.length > 0
    ? `['${mutation.invalidateKeys.join("', '")}']`
    : '[]';

  return `
// BEFORE (line ${mutation.lineNumber}):
// const ${mutation.varName} = useMutation({ ... });

// AFTER:
const ${mutation.varName} = useOfflineMutation(
  ${mutation.mutationFn},
  {
    module: '${moduleName}',
    operation: '${operationName}',
    priority: '${priority}', // high | normal | low
    invalidateKeys: ${invalidateKeysStr},
    successMessage: '${operationName} completed successfully',
    ${mutation.hasOnSuccess ? `onSuccess: () => {
      // Move your onSuccess logic here
    },` : ''}
  }
);
`;
}

/**
 * Main scanning function
 */
function scanAndReport(scanPath) {
  log('\n🔍 Scanning for useMutation calls...\n', 'cyan');

  const files = findFiles(scanPath);
  log(`Found ${files.length} TypeScript files to scan\n`, 'blue');

  const report = {
    totalFiles: files.length,
    filesWithMutations: 0,
    totalMutations: 0,
    byModule: {},
  };

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Skip files already using useOfflineMutation
    if (content.includes('useOfflineMutation')) {
      return;
    }

    // Check if file uses useMutation
    if (!content.includes('useMutation')) {
      return;
    }

    const mutations = detectUseMutations(filePath, content);

    if (mutations.length === 0) {
      return;
    }

    report.filesWithMutations++;
    report.totalMutations += mutations.length;

    const moduleName = inferModuleName(filePath);
    report.byModule[moduleName] = (report.byModule[moduleName] || 0) + mutations.length;

    log(`📄 ${filePath}`, 'yellow');
    log(`   Module: ${moduleName}`, 'cyan');
    log(`   Found ${mutations.length} mutation(s) to migrate:\n`, 'bright');

    mutations.forEach(mutation => {
      log(`   Line ${mutation.lineNumber}: ${mutation.varName}`, 'green');
      log(`     Function: ${mutation.mutationFn}`);
      log(`     Invalidates: ${mutation.invalidateKeys.join(', ') || 'none'}`);
      log(generateMigrationCode(mutation, moduleName), 'blue');
    });

    log('');
  });

  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 MIGRATION SUMMARY', 'bright');
  log('='.repeat(60), 'cyan');
  log(`\nTotal files scanned: ${report.totalFiles}`);
  log(`Files needing migration: ${report.filesWithMutations}`, 'yellow');
  log(`Total mutations to migrate: ${report.totalMutations}`, 'red');

  if (Object.keys(report.byModule).length > 0) {
    log('\nBy module:', 'cyan');
    Object.entries(report.byModule).forEach(([module, count]) => {
      log(`  ${module}: ${count} mutation(s)`, 'yellow');
    });
  }

  log('\n📝 Next steps:', 'bright');
  log('  1. Update imports: import { useOfflineMutation } from "@/lib/hooks/useOfflineMutation"');
  log('  2. Apply the migration code shown above');
  log('  3. Test offline functionality');
  log('  4. Update priorities based on business requirements\n');

  if (report.totalMutations === 0) {
    log('✅ No mutations found to migrate!', 'green');
  }
}

// Run the script
const scanPath = process.argv[2] || DEFAULT_SCAN_PATH;
const fullPath = path.resolve(scanPath);

if (!fs.existsSync(fullPath)) {
  log(`❌ Error: Path not found: ${fullPath}`, 'red');
  process.exit(1);
}

log(`\n🚀 Offline Mutation Migration Script`, 'bright');
log(`📁 Scanning path: ${fullPath}\n`, 'cyan');

scanAndReport(fullPath);
