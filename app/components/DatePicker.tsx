'use client'

import React, { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface DatePickerProps {
  label: string
  name: string
  value: string // Format: YYYY-MM-DD
  onChange: ((e: { target: { name: string; value: string } }) => void) |
            ((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void)
  required?: boolean
  minDate?: string // Format: YYYY-MM-DD
  maxDate?: string // Format: YYYY-MM-DD
  className?: string
}

export function DatePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  )
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  )
  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  )

  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatValueDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day)
    setSelectedDate(newDate)
    onChange({
      target: {
        name,
        value: formatValueDate(newDate),
      },
    })
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedDate(null)
    onChange({
      target: {
        name,
        value: '',
      },
    })
    setIsOpen(false)
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= currentYear - 100; year--) {
      years.push(year)
    }
    return years
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear)
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear)
    const days = []

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear

      const date = new Date(viewYear, viewMonth, day)
      const dateStr = formatValueDate(date)

      let isDisabled = false
      if (minDate && dateStr < minDate) isDisabled = true
      if (maxDate && dateStr > maxDate) isDisabled = true

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={clsx(
            'p-2 text-sm rounded-md hover:bg-gray-100 transition-colors',
            {
              'bg-blue-600 text-white hover:bg-blue-700': isSelected,
              'text-gray-900': !isSelected && !isDisabled,
              'text-gray-400 cursor-not-allowed': isDisabled,
            }
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full px-3 py-2 text-left border rounded-md shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'hover:border-gray-400 transition-colors',
          {
            'border-gray-300': !isOpen,
            'border-blue-500 ring-2 ring-blue-500': isOpen,
          }
        )}
      >
        <div className="flex items-center justify-between">
          <span className={clsx('text-sm', { 'text-gray-400': !selectedDate })}>
            {selectedDate ? formatDisplayDate(selectedDate) : 'Select date'}
          </span>
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Month and Year Selectors */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {generateYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Day names header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          </div>

          {/* Footer with Clear button */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
