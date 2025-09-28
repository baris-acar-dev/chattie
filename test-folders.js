// Test script to verify folder functionality
const testFolderAPI = async () => {
  const baseUrl = 'http://localhost:3000'
  const testUserId = 'test-user-123'
  
  console.log('Testing Folder API...')
  
  try {
    // Test 1: GET folders (should be empty initially)
    console.log('\n1. Testing GET /api/folders')
    const getFoldersResponse = await fetch(`${baseUrl}/api/folders?userId=${testUserId}`)
    const getFoldersResult = await getFoldersResponse.json()
    console.log('GET folders result:', getFoldersResult)
    
    // Test 2: POST create folder
    console.log('\n2. Testing POST /api/folders')
    const createFolderResponse = await fetch(`${baseUrl}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Folder',
        userId: testUserId,
        color: 'blue'
      })
    })
    const createFolderResult = await createFolderResponse.json()
    console.log('Create folder result:', createFolderResult)
    
    if (createFolderResult.folder) {
      const folderId = createFolderResult.folder.id
      
      // Test 3: PUT update folder
      console.log('\n3. Testing PUT /api/folders/[id]')
      const updateFolderResponse = await fetch(`${baseUrl}/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Test Folder',
          userId: testUserId
        })
      })
      const updateFolderResult = await updateFolderResponse.json()
      console.log('Update folder result:', updateFolderResult)
      
      // Test 4: GET folders again (should show the updated folder)
      console.log('\n4. Testing GET /api/folders again')
      const getFoldersResponse2 = await fetch(`${baseUrl}/api/folders?userId=${testUserId}`)
      const getFoldersResult2 = await getFoldersResponse2.json()
      console.log('GET folders result 2:', getFoldersResult2)
      
      // Test 5: DELETE folder
      console.log('\n5. Testing DELETE /api/folders/[id]')
      const deleteFolderResponse = await fetch(`${baseUrl}/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId })
      })
      const deleteFolderResult = await deleteFolderResponse.json()
      console.log('Delete folder result:', deleteFolderResult)
    }
    
    console.log('\n✅ All folder API tests completed!')
    
  } catch (error) {
    console.error('❌ Error testing folder API:', error)
  }
}

// Run the test if this is the main module
if (typeof window === 'undefined') {
  testFolderAPI()
}