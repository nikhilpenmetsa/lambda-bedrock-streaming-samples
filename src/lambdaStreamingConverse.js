const {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

exports.handler = awslambda.streamifyResponse(
  async (event, responseStream, _context) => {
    const PROMPT = 'Explain to a prescholer what is cloud computing.';

    const params = {
      modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      messages: [
        {
          role: 'user',
          content: [{ text: PROMPT }]
        }
      ],
      inferenceConfig: { 
        maxTokens: 2048, 
        temperature: 0.5, 
        topP: 0.5,
        topK: 250
      }
    };

    console.log('Request params:', JSON.stringify(params));
    const command = new ConverseStreamCommand(params);

    try {
      const response = await bedrock.send(command);
      console.log('Response received baby, streaming content...');
      
      // Extract and stream the response text in real-time
      for await (const item of response.stream) {
        console.log('Stream item:', JSON.stringify(item));
        if (item.contentBlockDelta) {
          const text = item.contentBlockDelta.delta?.text || '';
          if (text) {
            responseStream.write(text);
          }
        }
      }
    } catch (err) {
      console.error(`ERROR: Can't invoke model. Reason: ${err}`);
      responseStream.write(`Error: ${err.message}`);
    }

    responseStream.end();
  }
);