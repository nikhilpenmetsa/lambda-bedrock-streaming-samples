const {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateStreamCommand,
} = require('@aws-sdk/client-bedrock-agent-runtime');

const bedrockAgent = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

exports.handler = awslambda.streamifyResponse(
  async (event, responseStream, _context) => {
    // Extract query from event or use default
    //const query = event.queryStringParameters?.query || 'How does the Company determine if an arrangement qualifies as a lease?';

    // const params = {
    //   input: {
    //     text: "How does the Company determine if an arrangement qualifies as a lease?"
    //   },
    //   retrieveAndGenerateConfiguration: {
    //     type: 'KNOWLEDGE_BASE',
    //     knowledgeBaseConfiguration: {
    //       knowledgeBaseId: 'W7BHL3GCIW',
    //       modelArn: "arn:aws:bedrock:us-east-1:986112483391:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    //       retrievalConfiguration: {
    //         vectorSearchConfiguration: {
    //           numberOfResults: 10
    //         },
    //       },
    //     },
    //   },
    // };

    const params = {
      input: {
        text: "What type of lease arrangements does the Company enter into as a lessor, and how does it recognize the related income?"
      },
      retrieveAndGenerateConfiguration: {
        knowledgeBaseConfiguration: {
          generationConfiguration: {
            inferenceConfig: {
              textInferenceConfig: {
                maxTokens: 2048,
                stopSequences: ["\nObservation"],
                temperature: 0,
                topP: 1
              }
            }
          },
          knowledgeBaseId: "W7BHL3GCIW",
          modelArn: "arn:aws:bedrock:us-east-1:986112483391:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0",
          orchestrationConfiguration: {
            inferenceConfig: {
              textInferenceConfig: {
                maxTokens: 2048,
                stopSequences: ["\nObservation"],
                temperature: 0,
                topP: 1
              }
            }
          },
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 5
            }
          }
        },
        type: "KNOWLEDGE_BASE"
      }
    }

    console.log('Request params:', JSON.stringify(params));
    const command = new RetrieveAndGenerateStreamCommand(params);

    try {
      const response = await bedrockAgent.send(command);
      console.log('Response received, streaming content...');

      // Extract and stream the response text in real-time
      for await (const chunk of response.stream) {
        console.log('Stream chunk:', JSON.stringify(chunk));

        // Handle output text chunks
        if (chunk.output?.text) {
          responseStream.write(chunk.output.text);
        }
        
        // Handle citation chunks if needed
        if (chunk.citation) {
          // Optional: You can add citation handling here if needed
          console.log('Citation received:', JSON.stringify(chunk.citation));
        }
      }
    } catch (err) {
      console.error(`ERROR: Can't retrieve and generate. Reason: ${err}`);
      responseStream.write(`Error: ${err.message}`);
    }

    responseStream.end();
  }
);