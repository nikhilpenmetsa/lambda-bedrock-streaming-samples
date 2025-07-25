const util = require('util');
const stream = require('stream');
const { Readable } = stream;
const pipeline = util.promisify(stream.pipeline);

const {
	BedrockRuntimeClient,
	InvokeModelWithResponseStreamCommand,
} = require('@aws-sdk/client-bedrock-runtime'); // ES Modules import

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

function parseBase64(message) {
	return JSON.parse(Buffer.from(message, 'base64').toString('utf-8'));
}

exports.handler = awslambda.streamifyResponse(
	async (event, responseStream, _context) => {
		const PROMPT = 'Explain to a prescholer what is cloud computing.';
		const claudPrompt = `Human: Human:${PROMPT} Assistant:`;

		const params = {
			modelId: 'anthropic.claude-v2',
			//modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
			contentType: 'application/json',
			accept: '*/*',
			body: `{"prompt":"${claudPrompt}","max_tokens_to_sample":2048,"temperature":0.5,"top_k":250,"top_p":0.5,"stop_sequences":[], "anthropic_version":"bedrock-2023-05-31"}`,
		};

		console.log(params);

		const command = new InvokeModelWithResponseStreamCommand(params);

		const response = await bedrock.send(command);
		const chunks = [];

		for await (const chunk of response.body) {
			const parsed = parseBase64(chunk.chunk.bytes);
			chunks.push(parsed.completion);
			responseStream.write(parsed.completion);
		}

		console.log(chunks.join(''));
		responseStream.end();
	}
);
