import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL
    const authSecret = process.env.NEXTAUTH_SECRET
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: {
        hasDbUrl: !!dbUrl,
        hasAuthSecret: !!authSecret,
        dbUrlPrefix: dbUrl ? dbUrl.substring(0, 20) + '...' : 'NOT_SET'
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
