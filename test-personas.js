// Test script to verify personas are properly loaded
// Run this by visiting: http://localhost:3000 and opening browser console, then copy/paste this code

async function testPersonas() {
  console.log('🧪 Testing Personas API...')
  
  try {
    // Test fetching personas
    console.log('📡 Fetching personas...')
    const response = await fetch('/api/prompt-templates?userId=test-user')
    const data = await response.json()
    
    console.log('✅ API Response:', data)
    
    if (data.templates && data.templates.length > 0) {
      console.log('🎭 Found personas:')
      data.templates.forEach(persona => {
        console.log(`  • ${persona.name}: ${persona.description}`)
        console.log(`    Tags: [${persona.tags.join(', ')}]`)
        console.log(`    Temperature: ${persona.temperature}, Max Tokens: ${persona.maxTokens}`)
        console.log('    ---')
      })
    } else {
      console.log('⚠️ No personas found. Attempting to initialize...')
      
      // Try to initialize default personas
      const initResponse = await fetch('/api/prompt-templates/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user' })
      })
      
      const initData = await initResponse.json()
      console.log('🚀 Initialization response:', initData)
      
      // Retry fetching
      const retryResponse = await fetch('/api/prompt-templates?userId=test-user')
      const retryData = await retryResponse.json()
      console.log('🔄 Retry fetch result:', retryData)
    }
  } catch (error) {
    console.error('❌ Error testing personas:', error)
  }
}

// Auto-run the test
testPersonas()

console.log('🎯 Persona test script loaded! Check the output above.')