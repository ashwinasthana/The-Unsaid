import { NextRequest, NextResponse } from 'next/server'
import { SecurityFortress } from './lib/fortress'

export function middleware(request: NextRequest) {
  // Apply fortress security to all requests
  const securityCheck = SecurityFortress.validateRequest(request)
  
  if (!securityCheck.isValid || securityCheck.shouldBlock) {
    console.error(`🚨 BLOCKED REQUEST: ${request.url} - Threats: ${securityCheck.threats.join(', ')} - Risk: ${securityCheck.riskScore}`)
    
    return new NextResponse('Access Denied', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        ...SecurityFortress.createFortressHeaders()
      }
    })
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  const securityHeaders = SecurityFortress.createFortressHeaders()
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}