'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'

export function SearchButton() {
  const [modifierKey, setModifierKey] = useState<string>()

  useEffect(() => {
    setModifierKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl '
    )
  }, [])

  const handleClick = () => {
    // TODO: Implement search modal/functionality
    console.log('Search clicked')
  }

  return (
    <div className="w-full max-w-md">
      <button
        type="button"
        onClick={handleClick}
        className="flex h-10 w-full items-center gap-2 rounded-full bg-white px-4 text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-950/5 transition hover:ring-zinc-950/10 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/10 dark:hover:ring-white/20"
      >
        <MagnifyingGlassIcon className="h-5 w-5 flex-none text-zinc-400" />
        <span className="flex-auto text-left">Find something...</span>
        {modifierKey && (
          <kbd className="flex gap-1 text-xs text-zinc-400 dark:text-zinc-500">
            <kbd className="font-sans">{modifierKey}</kbd>
            <kbd className="font-sans">K</kbd>
          </kbd>
        )}
      </button>
    </div>
  )
}
