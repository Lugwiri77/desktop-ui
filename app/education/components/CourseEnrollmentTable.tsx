'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/table';
import { Badge } from '../../components/badge';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';
import { Button } from '../../components/button';
import type { CourseEnrollment, EnrollmentStatus } from '../../../types/education';

interface CourseEnrollmentTableProps {
  studentId: string;
  institutionId: string;
  onEnrollInCourse?: () => void;
}

/**
 * Course Enrollment Table - For University/College Students ONLY
 *
 * Displays all courses the student is enrolled in, including:
 * - Course code and name
 * - Instructor
 * - Credits
 * - Current grade
 * - Enrollment status
 */
export default function CourseEnrollmentTable({
  studentId,
  institutionId,
  onEnrollInCourse,
}: CourseEnrollmentTableProps) {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, [studentId]);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const query = `
        query GetCourseEnrollments($studentId: String!) {
          getCourseEnrollments(studentId: $studentId) {
            id
            courseCode
            courseName
            credits
            instructorName
            instructorEmail
            semester
            grade
            midtermScore
            finalScore
            currentScore
            enrollmentStatus
            enrolledDate
          }
        }
      `;

      const response = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables: { studentId },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setEnrollments(result.data.getCourseEnrollments || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course enrollments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: EnrollmentStatus) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'dropped':
        return 'zinc';
      case 'withdrawn':
        return 'orange';
      case 'incomplete':
        return 'amber';
      case 'failed':
        return 'red';
      default:
        return 'zinc';
    }
  };

  const getStatusLabel = (status: EnrollmentStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'dropped':
        return 'Dropped';
      case 'withdrawn':
        return 'Withdrawn';
      case 'incomplete':
        return 'Incomplete';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatGrade = (enrollment: CourseEnrollment): string => {
    if (enrollment.grade) {
      return enrollment.grade;
    }
    if (enrollment.currentScore !== undefined && enrollment.currentScore !== null) {
      return `${enrollment.currentScore.toFixed(1)}%`;
    }
    return 'N/A';
  };

  const calculateTotalCredits = () => {
    return enrollments
      .filter((e) => e.enrollmentStatus === 'active' || e.enrollmentStatus === 'completed')
      .reduce((sum, e) => sum + (e.credits || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <svg
            className="size-8 animate-spin text-zinc-950 dark:text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <Text className="mt-3">Loading course enrollments...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/20">
        <div className="flex items-start">
          <svg
            className="mr-3 mt-0.5 size-5 flex-shrink-0 text-red-600 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <Text className="font-semibold text-red-800 dark:text-red-200">Error Loading Enrollments</Text>
            <Text className="mt-1 text-red-700 dark:text-red-300">{error}</Text>
            <Button onClick={fetchEnrollments} className="mt-3" plain>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2}>Course Enrollments</Heading>
          <Text className="mt-1">
            {enrollments.length > 0
              ? `Enrolled in ${enrollments.length} course${enrollments.length === 1 ? '' : 's'} • ${calculateTotalCredits()} credits`
              : 'No course enrollments'}
          </Text>
        </div>
        {onEnrollInCourse && (
          <Button onClick={onEnrollInCourse}>Enroll in Course</Button>
        )}
      </div>

      {/* Empty State */}
      {enrollments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-950/10 p-12 text-center dark:border-white/10">
          <svg
            className="mx-auto size-12 text-zinc-400 dark:text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <Text className="mt-4 text-zinc-600 dark:text-zinc-400">No courses enrolled yet</Text>
          <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Get started by enrolling in your first course.
          </Text>
          {onEnrollInCourse && (
            <Button onClick={onEnrollInCourse} className="mt-6">
              Enroll in Course
            </Button>
          )}
        </div>
      ) : (
        /* Table */
        <Table striped>
          <TableHead>
            <TableRow>
              <TableHeader>Course</TableHeader>
              <TableHeader>Instructor</TableHeader>
              <TableHeader>Semester</TableHeader>
              <TableHeader>Credits</TableHeader>
              <TableHeader>Grade</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell>
                  <div className="font-medium text-zinc-950 dark:text-white">{enrollment.courseCode}</div>
                  <div className="mt-0.5 text-zinc-500 dark:text-zinc-400">{enrollment.courseName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-zinc-700 dark:text-zinc-300">{enrollment.instructorName}</div>
                  {enrollment.instructorEmail && (
                    <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-500">
                      {enrollment.instructorEmail}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-zinc-700 dark:text-zinc-300">{enrollment.semester || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-zinc-950 dark:text-white">{enrollment.credits || 0}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-zinc-950 dark:text-white">{formatGrade(enrollment)}</div>
                  {enrollment.midtermScore !== undefined && enrollment.midtermScore !== null && (
                    <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-500">
                      Midterm: {enrollment.midtermScore.toFixed(1)}%
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge color={getStatusBadgeColor(enrollment.enrollmentStatus)}>
                    {getStatusLabel(enrollment.enrollmentStatus)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Summary Stats */}
      {enrollments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Active Courses</Text>
            <div className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
              {enrollments.filter((e) => e.enrollmentStatus === 'active').length}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Total Credits</Text>
            <div className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
              {calculateTotalCredits()}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Completed</Text>
            <div className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
              {enrollments.filter((e) => e.enrollmentStatus === 'completed').length}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Average Grade</Text>
            <div className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
              {(() => {
                const enrollmentsWithGrades = enrollments.filter(
                  (e) => e.currentScore !== undefined && e.currentScore !== null
                );
                if (enrollmentsWithGrades.length === 0) return 'N/A';
                const avg =
                  enrollmentsWithGrades.reduce((sum, e) => sum + (e.currentScore || 0), 0) /
                  enrollmentsWithGrades.length;
                return `${avg.toFixed(1)}%`;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
