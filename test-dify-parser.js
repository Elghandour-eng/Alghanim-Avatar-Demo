// Test file for Dify Response Parser
// This file demonstrates how to use the Dify response parsing functionality

const testResponses = {
    // Test case 1: Response without media
    textOnly: {
        "message": "حياك الله! أنا ليلى، شسمك؟ تفضل علّمني شنو تبي تعرف عن كاديلاك اليوم!",
        "is_media": 0,
        "media_url": ""
    },
    
    // Test case 2: Response with media
    withMedia: {
        "message": "هذا فيديو عن سيارة كاديلاك الجديدة",
        "is_media": 1,
        "media_url": "https://example.com/cadillac-video.mp4"
    },
    
    // Test case 3: Response with media but empty URL
    mediaNoUrl: {
        "message": "سأرسل لك صورة قريباً",
        "is_media": 1,
        "media_url": ""
    },
    
    // Test case 4: Invalid response (missing message)
    invalid: {
        "is_media": 0,
        "media_url": ""
    },
    
    // Test case 5: String format
    stringFormat: '{"message": "مرحبا بك في عالم كاديلاك", "is_media": 0, "media_url": ""}',
    
    // Test case 6: Markdown code block format (user's test case)
    markdownFormat: '```json{\n  "message": "Good morning! Which Cadillac interests you?",\n  "is_media": 0,\n  "media_url": ""\n}```'
};

// Function to simulate the parseDifyResponse function (for testing purposes)
// Function to simulate the parseDifyResponse function (for testing purposes)
function parseDifyResponse(responseData) {
    try {
        console.log('🔍 Parsing PAIR response:', responseData);
        
        // Check if responseData is empty or null
        if (!responseData || responseData === '') {
            console.warn('⚠️ Warning: Empty or null PAIR response data');
            return {
                message: '',
                is_media: 0,
                media_url: '',
                hasMedia: false,
                isValid: false,
                error: 'Empty response data'
            };
        }
        
        // Handle both string and object inputs
        let parsedData;
        if (typeof responseData === 'string') {
            // Trim whitespace and check if string is empty
            const trimmedData = responseData.trim();
            if (trimmedData === '') {
                console.warn('⚠️ Warning: Empty string in PAIR response');
                return {
                    message: '',
                    is_media: 0,
                    media_url: '',
                    hasMedia: false,
                    isValid: false,
                    error: 'Empty string response'
                };
            }
            
            // Check for markdown code block syntax and clean it
            let jsonContent = trimmedData;
            if (trimmedData.startsWith('```json') && trimmedData.endsWith('```')) {
                console.log('🧹 Detected markdown code block, cleaning...');
                // Remove ```json from start and ``` from end
                jsonContent = trimmedData.slice(7, -3).trim(); // Remove ```json (7 chars) and ``` (3 chars)
                console.log('✅ Markdown code block cleaned');
            }
            
            // Try to parse JSON
            try {
                const cleanedJson = jsonContent.replace(/\s+/g, ' ').trim();
                parsedData = JSON.parse(cleanedJson);
                console.log('✅ JSON.parse successful after cleaning');
            } catch (jsonError) {
                console.warn('⚠️ Warning: Invalid JSON in PAIR response, treating as plain text');
                // If it's not valid JSON, treat it as a plain text message
                parsedData = {
                    message: trimmedData,
                    is_media: 0,
                    media_url: ''
                };
            }
        } else if (typeof responseData === 'object' && responseData !== null) {
            parsedData = responseData;
        } else {
            console.warn('⚠️ Warning: Invalid response data type:', typeof responseData);
            return {
                message: '',
                is_media: 0,
                media_url: '',
                hasMedia: false,
                isValid: false,
                error: 'Invalid response data type'
            };
        }
        
        // Extract the required fields with safe defaults
        const result = {
            message: parsedData.message || '',
            is_media: parsedData.is_media || 0,
            media_url: parsedData.media_url || '',
            hasMedia: (parsedData.is_media === 1 || parsedData.is_media === '1'),
            isValid: true
        };
        
        // Validate required fields
        if (!result.message) {
            console.warn('⚠️ Warning: PAIR response missing message field');
            result.isValid = false;
        }
        
        // Log parsing result
        console.log(`✅ PAIR response parsed successfully:`);
        console.log(`   📝 Message: "${result.message.substring(0, 100)}${result.message.length > 100 ? '...' : ''}"`);
        console.log(`   🎬 Has Media: ${result.hasMedia}`);
        if (result.hasMedia) {
            console.log(`   🔗 Media URL: ${result.media_url}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error parsing PAIR response:', error);
        return {
            message: '',
            is_media: 0,
            media_url: '',
            hasMedia: false,
            isValid: false,
            error: error.message
        };
    }
}
// Test function
function runTests() {
    console.log('🧪 Starting Dify Response Parser Tests\n');
    
    Object.entries(testResponses).forEach(([testName, testData]) => {
        console.log(`\n📋 Test Case: ${testName}`);
        console.log('📥 Input:', JSON.stringify(testData, null, 2));
        
        const result = parseDifyResponse(testData);
        
        console.log('📤 Output:', JSON.stringify(result, null, 2));
        console.log('─'.repeat(50));
    });
    
    console.log('\n✅ All tests completed!');
}

// Example usage for API testing
function generateCurlExamples() {
    console.log('\n🌐 API Testing Examples:\n');
    
    console.log('1. Test text-only response:');
    console.log(`curl -X POST http://localhost:3000/api/parse-dify-response \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ response: testResponses.textOnly })}'`);
    
    console.log('\n2. Test response with media:');
    console.log(`curl -X POST http://localhost:3000/api/parse-dify-response \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ response: testResponses.withMedia })}'`);
    
    console.log('\n3. Test string format:');
    console.log(`curl -X POST http://localhost:3000/api/parse-dify-response \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ response: testResponses.stringFormat })}'`);
}

// JavaScript client example
function generateClientExample() {
    console.log('\n💻 JavaScript Client Example:\n');
    
    const clientCode = `
// Example: Using the Dify parser in a web application
async function parseDifyResponse(responseData) {
    try {
        const response = await fetch('/api/parse-dify-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ response: responseData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Message:', result.data.message);
            console.log('Has Media:', result.data.hasMedia);
            
            if (result.data.hasMedia) {
                console.log('Media URL:', result.data.media_url);
                // Handle media display logic here
                displayMedia(result.data.media_url);
            } else {
                // Handle text-only response
                displayTextMessage(result.data.message);
            }
        } else {
            console.error('Parsing failed:', result.error);
        }
    } catch (error) {
        console.error('API call failed:', error);
    }
}

function displayMedia(mediaUrl) {
    // Example media display logic
    if (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm')) {
        // Display video
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.controls = true;
        document.body.appendChild(video);
    } else if (mediaUrl.includes('.jpg') || mediaUrl.includes('.png')) {
        // Display image
        const img = document.createElement('img');
        img.src = mediaUrl;
        document.body.appendChild(img);
    }
}

function displayTextMessage(message) {
    // Display text message
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = 'chat-message';
    document.body.appendChild(messageDiv);
}
`;
    
    console.log(clientCode);
}

// Run the tests if this file is executed directly
if (require.main === module) {
    runTests();
    generateCurlExamples();
    generateClientExample();
}

module.exports = {
    parseDifyResponse,
    testResponses,
    runTests
};
