"use client";

import { useRef, useState, useEffect } from "react";

interface EditableNameProps {
  initialName: string;
  defaultName: string;
  isRenaming: boolean;
  onFinishRename: (name: string) => void;
}

export function EditableName({
  initialName,
  defaultName,
  isRenaming,
  onFinishRename,
}: EditableNameProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  if (isRenaming) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={() => onFinishRename(name)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onFinishRename(name);
          } else if (e.key === "Escape") {
            setName(initialName);
            onFinishRename(initialName);
          }
          // Prevent space from triggering button click
          if (e.key === " ") {
            e.stopPropagation();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder={defaultName}
        className="bg-transparent border-none w-full mr-4 px-0.5 focus:outline-none focus:ring-1 text-sm"
      />
    );
  }

  return <span className="truncate px-0.5">{initialName || defaultName}</span>;
}
