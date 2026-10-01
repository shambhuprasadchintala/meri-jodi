import React, { useRef, useEffect } from "react"

export default function OtpBoxInput({
  value = "",
  onChange,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = true,
  idPrefix = "otp-digit"
}) {
  const inputsRef = useRef([])

  // Normalize value to array of characters
  const digits = Array.from({ length }, (_, i) => (value && value[i] ? value[i] : ""))

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index, val) => {
    // Only accept numeric characters
    const cleanVal = val.replace(/\D/g, "")
    
    // If multiple characters are pasted into one box
    if (cleanVal.length > 1) {
      handlePasteDirect(cleanVal)
      return
    }

    const newDigits = [...digits]
    newDigits[index] = cleanVal.slice(-1)
    const combined = newDigits.join("")
    onChange(combined)

    // Advance focus if digit was entered
    if (cleanVal && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
      inputsRef.current[index + 1]?.select()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous box and clear it
        e.preventDefault()
        const newDigits = [...digits]
        newDigits[index - 1] = ""
        onChange(newDigits.join(""))
        inputsRef.current[index - 1]?.focus()
      } else if (digits[index]) {
        // Clear current box
        const newDigits = [...digits]
        newDigits[index] = ""
        onChange(newDigits.join(""))
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePasteDirect = (pastedText) => {
    const cleaned = pastedText.replace(/\D/g, "").slice(0, length)
    onChange(cleaned)
    const nextIndex = Math.min(cleaned.length, length - 1)
    inputsRef.current[nextIndex]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text")
    handlePasteDirect(text)
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          id={`${idPrefix}-${i}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-2xl sm:text-3xl font-extrabold rounded-2xl border-2 transition-all outline-none select-none ${
            error
              ? "border-red-400 bg-red-50/40 text-red-700 focus:border-red-600 focus:ring-2 focus:ring-red-200"
              : digits[i]
              ? "border-[#842029] bg-white text-[#842029] shadow-xs"
              : "border-gray-200 bg-gray-50/70 text-gray-800 focus:border-[#842029] focus:bg-white focus:ring-2 focus:ring-rose-100"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="•"
        />
      ))}
    </div>
  )
}
