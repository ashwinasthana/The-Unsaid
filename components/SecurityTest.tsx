"use client"

import { useState } from "react"
import { SecurityValidator } from "@/lib/security"

export default function SecurityTest() {
  const [testInput, setTestInput] = useState("")
  const [result, setResult] = useState("")

  const testPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '"><script>alert("XSS")</script>',
    '<div onclick="alert(\'XSS\')">click</div>',
    '<object data="javascript:alert(\'XSS\')"></object>',
    'eval(alert("XSS"))',
    '<style>@import "javascript:alert(\'XSS\')"</style>',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">'
  ]

  const testSecurity = () => {
    const sanitized = SecurityValidator.sanitizeInput(testInput)
    const validation = SecurityValidator.validateMessage(testInput)
    
    setResult(`
Original: ${testInput}
Sanitized: ${sanitized}
Valid: ${validation.isValid}
Error: ${validation.error || 'None'}
    `)
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Security Test Panel</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Input:</label>
        <textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Enter malicious payload to test..."
        />
      </div>

      <div className="mb-4">
        <button
          onClick={testSecurity}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Security
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Quick Test Payloads:</h4>
        <div className="grid grid-cols-2 gap-2">
          {testPayloads.map((payload, index) => (
            <button
              key={index}
              onClick={() => setTestInput(payload)}
              className="text-left p-2 bg-red-100 hover:bg-red-200 rounded text-xs"
            >
              {payload.substring(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium mb-2">Test Result:</h4>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
}