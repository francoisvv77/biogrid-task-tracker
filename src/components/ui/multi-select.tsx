import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[] | undefined
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const handleSelect = (value: string) => {
    const currentSelected = selected || []
    if (currentSelected.includes(value)) {
      onChange(currentSelected.filter((item) => item !== value))
    } else {
      onChange([...currentSelected, value])
    }
  }

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            (selected || []).length > 0 ? "h-full" : "h-10",
            className
          )}
        >
          <div className="flex gap-1 flex-wrap">
            {(selected || []).length === 0 && placeholder}
            {(selected || []).map((value) => (
              <Badge
                variant="secondary"
                key={value}
                className="mr-1 mb-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(value)
                }}
              >
                {options.find((option) => option.value === value)?.label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSelect(value)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(value)
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="p-2">
          <Input
            placeholder="Search options..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="mb-2"
          />
        </div>
        <div className="max-h-64 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No options found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  (selected || []).includes(option.value) && "bg-accent"
                )}
                onClick={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    (selected || []).includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 