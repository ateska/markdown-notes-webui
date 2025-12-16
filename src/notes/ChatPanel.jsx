import React, { useState, useRef, useEffect } from 'react';
import {
	Button, Input,
	Spinner,
	Card, CardHeader, CardBody
} from 'reactstrap';

import { useAppSelector, FullscreenButton } from 'asab_webui_components';

import { MarkdownComponent } from './MarkdownComponent.jsx';

export default function ChatPanel({ app, notePath }) {
	const tenant = useAppSelector(state => state.tenant?.current);
	const LLMAPI = app.axiosCreate("llm");

	const [messages, setMessages] = useState(undefined);
	const [inputValue, setInputValue] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [cardFullscreen, setCardFullscreen] = useState(false);
	const [models, setModels] = useState([]);
	const [model, setModel] = useState(undefined);

	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);
	const controllerRef = useRef(null);

	const loadModels = async () => {
		// const response = await LLMAPI.get(`/api/tags`);
		const response = await LLMAPI.get(`/v1/models`);
		console.log(response.data.data);
		setModels(response.data.data);
		if (response.data.data.length > 0 && model === undefined)  {
			setModel(response.data.data[0].id);
		}
	}

	useEffect(() => {
		handleReset();
		loadModels();
	}, []);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Auto-resize textarea to fit content
	const adjustTextareaHeight = () => {
		const textarea = inputRef.current;
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = `${textarea.scrollHeight}px`;
		}
	};

	useEffect(() => {
		adjustTextareaHeight();
	}, [inputValue]);

	const handleSend = async () => {
		if (!inputValue.trim() || isLoading) return;

		const userMessage = inputValue.trim();
		setInputValue('');
		
		// Add user message
		const newUserMessage = {
			role: 'user',
			content: userMessage,
			timestamp: new Date(),
		};
		
		setMessages(prev => [
			...prev.filter(message => message.role !== 'error'),
			newUserMessage,
		]);

		// Cancel any in-flight request
		controllerRef.current?.abort();

		const controller = new AbortController();
    	controllerRef.current = controller;

		const request = new Request(app.getServiceURL("llm") + "/v1/chat/completions", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: model,
				stream: true,
				messages: [
					...messages,
					{
						role: 'user',
						content: userMessage,
					},
				],
				// tools: [{"Markdown notes": "Markdown notes"}],
			}),
			signal: controller.signal,
		});

		setIsLoading(true);
		try {
			// We use fetch instead of axios to get the streaming response
			const response = await fetch(request);
			if (!response.ok) {
				let r = await response.json()
				setMessages(prev => [...prev, {
					role: 'error',
					content: r.error,
				}]);
				return;
			}

			let newMessage = {
				id: Math.random().toString(36).substring(2, 15),
				role: 'assistant',
				content: '',
				timestamp: new Date(),
				loading: true,
			}
			setMessages(prev => [...prev, newMessage]);

			const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
			while (true) {
				const { done, value } = await reader.read();
				console.log(value);

				if (done) {
					// Final message
					setMessages(prev => [
						...prev.filter(message => message.id !== newMessage.id),
						{ role: 'assistant', content: newMessage.content, timestamp: newMessage.timestamp }
					]);
					break;
				}

				// Value is a Uint8Array
				const cleanValue = value.startsWith("data: ") ? value.slice(6) : value;
				const data = JSON.parse(cleanValue);

				console.log(">>>", data);

				// const error = data?.error;
				// if (error) {
				// 	setMessages(prev => [...prev, {
				// 		role: 'error',
				// 		content: error,
				// 	}]);
				// 	return;
				// }

				const content = data.choices[0].delta.reasoning_content;
				if (content) {
					newMessage.content += content;
					setMessages(prev => [...prev.filter(message => message.id !== newMessage.id), newMessage]);
				}
			}
			
		}

		catch (err) {
			if (err?.name === "AbortError") {
				return;
			}
			console.error("Error sending message:", err);
			app.addAlertFromException(err, 'Failed to send message');
		}

		finally {
			setIsLoading(false);
		}
	};

	const handleReset = () => {
		setMessages([
			{
				role: 'system',
				content: `You are a helpful assistant that can answer questions and help with tasks.
				The user is a writer of Markdown note ${notePath}.
				Use the MCP server 'Markdown notes' to work with the notes.
				Use the GitHub Flavored Markdown syntax to format your responses.`
			}
		]);
	}

	return (<Card className={`h-100 ${cardFullscreen ? 'card-fullscreen' : ''}`}>
		<CardHeader className='card-header-flex'>
			<div className='flex-fill'>
				<h3>Chat</h3>
			</div>
			<Button
				color="warning"
				outline
				onClick={handleReset}>
				<i className="bi bi-x-lg"></i>
			</Button>
			<FullscreenButton fullscreen={cardFullscreen} setFullscreen={setCardFullscreen} />
		</CardHeader>
		<CardBody>
			{messages?.map((message, index) => (
				<Message key={index} app={app} message={message} />
			))}

			{isLoading
			? <div className="chat-input-container d-flex">
				<Spinner size="sm" className="ms-2 me-2" />
				<span className="text-muted">Thinking...</span>
				<div style={{ flexGrow: '1' }}>&nbsp;</div>
				<a
					href="#"
					className="text-danger me-2"
					onClick={(e) => {
						e.preventDefault();
						controllerRef.current?.abort();
						controllerRef.current = null;
					}}
				>
					<i className="bi bi-stop-circle" title="Stop"></i>
				</a>
			</div>

			: <div className="chat-input-container">
				<Input
					innerRef={inputRef}
					type="textarea"
					rows="1"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					placeholder="Type your message..."
					disabled={isLoading}
					className="chat-input"
					style={{ overflow: 'hidden', resize: 'none' }}
				/>
				<div className="d-flex">
					<select className="form-select" value={model} onChange={(e) => setModel(e.target.value)} style={{ maxWidth: '20em', fontSize: '0.8em' }}>
						{models.map((model) => (
							<option key={model.id} value={model.id}>{model.id}</option>
						))}
					</select>
					<div style={{ flexGrow: '1' }}>&nbsp;</div>
					<Button
						color="link"
						onClick={handleSend}
						disabled={!inputValue.trim() || isLoading}
						size="sm"
					>
						<i className="bi bi-arrow-up-circle-fill"></i>
					</Button>
				</div>
			</div>}
		</CardBody>
	</Card>);
}


const Message = ({ app, message, ...props }) => {
	switch (message.role) {
		case 'system':
			return null; // System messages are not displayed in the chat
		case 'user':
			return <UserMessage app={app} message={message} {...props} />;
		case 'assistant':
			return <AssistantMessage app={app} message={message} {...props} />;
		case 'error':
			return <ErrorMessage app={app} message={message} {...props} />;
		default:
			return <div>Unknown message role: {message.role}</div>;
	}
};


function UserMessage({ app, message, ...props }) {
	return <Card className="mb-3">
		<CardBody className="pb-2 pt-2">
			{message.content}
		</CardBody>
	</Card>;
}


function AssistantMessage({ app, message, ...props }) {
	return <div className="mb-3">
		<MarkdownComponent>{message.content}</MarkdownComponent>
	</div>;
}

function ErrorMessage({ app, message, ...props }) {
	return <div className="mb-3 text-danger">
		<i className="bi bi-exclamation-triangle me-1"></i>
		<span>Error: {message.content}</span>
	</div>;
}
