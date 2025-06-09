const {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateStreamCommand,
} = require('@aws-sdk/client-bedrock-agent-runtime');

const bedrockAgent = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

exports.handler = awslambda.streamifyResponse(
  async (event, responseStream, _context) => {
    // Extract query from event or use default
    const query = event.queryStringParameters?.query || 'How does the Company determine if an arrangement qualifies as a lease?';
    
    const params = {
      input: {
        text: "How does the Company determine if an arrangement qualifies as a lease?"
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: 'W7BHL3GCIW',
          modelArn: "arn:aws:bedrock:us-east-1:986112483391:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0",
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 10
            },
          },
        },
      },
    };

    console.log('Request params:', JSON.stringify(params));
    const command = new RetrieveAndGenerateStreamCommand(params);

    try {
      const response = await bedrockAgent.send(command);
      console.log('Response received, streaming content...');
      
      // Extract and stream the response text in real-time
      for await (const chunk of response.stream) {
        console.log('Stream chunk:', JSON.stringify(chunk));
        
        if (chunk.chunk?.bytes) {
          // Parse the bytes as JSON
          const chunkData = JSON.parse(Buffer.from(chunk.chunk.bytes).toString());
          
          if (chunkData.delta?.text) {
            responseStream.write(chunkData.delta.text);
          }
        }
      }
    } catch (err) {
      console.error(`ERROR: Can't retrieve and generate. Reason: ${err}`);
      responseStream.write(`Error: ${err.message}`);
    }

    responseStream.end();
  }
);