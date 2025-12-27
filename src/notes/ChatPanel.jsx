import React, { useState, useRef, useEffect } from 'react';
import {
	Button, Input,
	Spinner,
	Card, CardHeader, CardBody,
	Collapse,
} from 'reactstrap';

import { useAppSelector, FullscreenButton } from 'asab_webui_components';

import { MarkdownComponent } from './MarkdownComponent.jsx';

export default function ChatPanel({ app, notePath }) {
	const tenant = useAppSelector(state => state.tenant?.current);
	const MarkdownNotesAPI = app.axiosCreate("markdown-notes");

	const [chatId, setChatId] = useState(undefined);
	const [messages, setMessages] = useState(undefined);
	const [inputValue, setInputValue] = useState('');
	const [activeTasks, setActiveTasks] = useState(0);
	const [cardFullscreen, setCardFullscreen] = useState(false);
	const [model, setModel] = useState(undefined);

	const inputRef = useRef(null);
	const chatBottomRef = useRef(null);
	const controllerRef = useRef(null);

	const websocketRef = useRef(null);

	// This is a reply message from the LLM chat service to the client.
	const handleReply = (message) => {

		switch (message.type) {

			case 'chat.mounted':
				setChatId(message.chat_id);
				setModel(message.model);
				return;

			case 'tasks.updated':
				setActiveTasks(message.count);
				return;

			// Responses from /v1/responses / LLMChatProviderV1Response
			case 'v1r.response.created':
				return;

			case 'v1r.response.in_progress':
				return;

			case 'v1r.response.completed':
				setTimeout(() => {
					chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
				}, 200);	
				return;

			case 'v1r.response.output_item.added':
				
				// Add a new message
				let msg = {
					item_id: message.data.item.id,
					status: message.data.item.status, // in_progress
					type: message.data.item.type,  // "message" / "reasoning"
					timestamp: new Date(),
					content: '',
				};

				if (message.data.item.role !== undefined) {
					msg.role = message.data.item.role;
				}

				if (message.data.item.name !== undefined) {
					msg.name = message.data.item.name;
				}

				setMessages(prev => [
					...prev,
					msg,
				]);

				chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });

				return;

			case 'v1r.response.output_item.done':
				setMessages(prev => [
					...prev.map(
						msg => msg.item_id === message.data.item_id
						? {
							...msg,
							status: 'done',
							arguments: message.data.item.arguments || undefined,
						}
						: msg
					),
				]);
				return;

			case 'v1r.response.output_text.delta':
				setMessages(prev => [
					...prev.map(
						msg => msg.item_id === message.data.item_id
						? { ...msg, content: msg.content + message.data.delta }
						: msg
					),
				]);
				chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
				return;

			case 'v1r.response.output_text.done':
				return;
	
			case 'v1r.response.reasoning_text.delta':
				setMessages(prev => [
					...prev.map(
						msg => msg.item_id === message.data.item_id
						? { ...msg, content: msg.content + message.data.delta }
						: msg
					),
				]);
				return;

			case 'v1r.response.reasoning_text.done':
				return;

			case 'v1r.response.content_part.added':
				return;
			
			case 'v1r.response.content_part.done':
				return;

			case 'v1r.response.reasoning_part.added':
				return;
			
			case 'v1r.response.reasoning_part.done':
				return;
	
			default:
				// Let's assume that we received a generic reply from LLV
				console.log("Unknown message:", message.type, message.data);			
				return;
		}
	}

	useEffect(() => {
		handleReset();

		const connectToChat = async () => {
			if (websocketRef.current !== null) {
				websocketRef.current.close();
				websocketRef.current = null;
			}

			let param = '';
			if (chatId) {
				param = `?chat_id=${chatId}`;
			} else {
				param = '';
			}

			const websocket = app.createWebSocket("markdown-notes", `${tenant}/llmchat${param}`);
			websocketRef.current = websocket;
			websocket.onopen = () => {
				console.log("Connected to LLM Chat");
			}
			websocket.onmessage = (event) => {
				handleReply(JSON.parse(event.data));
			}
			websocket.onclose = () => {
				console.log("Disconnected from LLM Chat");
				setActiveTasks(0);
				websocketRef.current = null;
			}
			websocket.onerror = (event) => {
				console.error("Error connecting to LLM Chat:", event);
				setActiveTasks(0);
				// TODO: Indicate the error in the chat
				websocketRef.current = null;
			}
		}

		connectToChat();
		// Reconnect the websocket if it is closed

		let interval = setInterval(() => {
			if (websocketRef.current === null) {
				connectToChat();
			}
		}, 1000);

		return () => {
			websocketRef.current?.close();
			websocketRef.current = null;
			clearInterval(interval);
		};
	}, []);

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
		if (!inputValue.trim() || activeTasks > 0) return;
		if (websocketRef.current === null) return;

		const userMessage = inputValue.trim();
		setActiveTasks(1); // One active task - will be replaced by the info from the LLM chat service
		setInputValue('');

		// Add user message
		const newUserMessage = {
			type: 'message',
			role: 'user',
			content: userMessage,
			timestamp: new Date(),
		};
		
		setMessages(prev => [
			...prev.filter(message => message.type !== 'error'),
			newUserMessage,
		]);

		websocketRef.current?.send(JSON.stringify({
			type: 'user.message.created',
			content: userMessage,
		}));
	}


	const handleReset = () => {
		setMessages([]);
		setChatId(undefined);
		websocketRef.current?.close(); // Force to reconnect the websocket
	}

	return (<Card className={`h-100 ${cardFullscreen ? 'card-fullscreen' : ''}`}>
		<CardHeader className='card-header-flex'>
			<div className='flex-fill'>
				<h3 title={chatId ? `Chat ID: ${chatId}` : ''}>Chat</h3>
			</div>
			<Button
				color="warning"
				outline
				onClick={handleReset}>
				<i className="bi bi-x-lg"></i>
			</Button>
			<FullscreenButton fullscreen={cardFullscreen} setFullscreen={setCardFullscreen} />
		</CardHeader>
		<CardBody className="overflow-scroll">
			{messages?.map((message, index) => (
				<Message key={index} app={app} message={message} />
			))}

			{activeTasks > 0
			? <div className="chat-input-container d-flex">
				<Spinner size="sm" className="ms-2 me-2" />
				<span className="text-muted" title={`${activeTasks} tasks`}>Working ...</span>
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
					disabled={chatId === undefined}
					className="chat-input"
					style={{ overflow: 'hidden', resize: 'none' }}
				/>
				<div className="d-flex">
					{model && (
						<div className="text-muted" style={{ fontSize: '0.8em', marginTop: '4px' }}>{model}</div>
					)}
					<div style={{ flexGrow: '1' }}>&nbsp;</div>
					<Button
						color="link"
						onClick={handleSend}
						disabled={!inputValue.trim()}
						size="sm"
					>
						<i className="bi bi-arrow-up-circle-fill"></i>
					</Button>
				</div>
			</div>}

			<div ref={chatBottomRef}>&nbsp;</div>
	
		</CardBody>
	</Card>);
}


const Message = ({ app, message, ...props }) => {
	switch (message.type) {
		case 'error':
			return <ErrorMessage app={app} message={message} {...props} />;
		case 'reasoning':
			return <ReasoningMessage app={app} message={message} {...props} />;
		case 'message':
			switch (message.role) {
				case 'user':
					return <UserMessage app={app} message={message} {...props} />;
				case 'assistant':
					return <AssistantMessage app={app} message={message} {...props} />;	
				default:
					return <div>Unknown message role: {message.role}</div>;
			}
		case 'function_call':
			return <FunctionCallMessage app={app} message={message} {...props} />;
		default:
			return <div>Unknown message type: {message.type}</div>;
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

function ReasoningMessage({ app, message, ...props }) {
	const [isReasoningOpen, setIsReasoningOpen] = useState(false);

	return <div className="mb-3">

		<Button color="link" onClick={() => setIsReasoningOpen(!isReasoningOpen)} size="sm">
			<i className={`bi ${isReasoningOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
		</Button>
		<span className="text-muted" style={{ fontSize: '0.8em' }}>Reasoning ...</span>
		<Collapse isOpen={isReasoningOpen} className="text-muted mb-3" style={{ fontSize: '0.8em' }}>
			{message.content}
		</Collapse>
	</div>;
}

function ErrorMessage({ app, message, ...props }) {
	return <div className="mb-3 text-danger">
		<i className="bi bi-exclamation-triangle me-1"></i>
		<span>Error: {message.content}</span>
	</div>;
}

function FunctionCallMessage({ app, message, ...props }) {
	return <div className="mb-3 text-muted mb-3" style={{ fontSize: '0.8em' }}>
		<span>Calling function <code>{message.name}</code> ...</span>
		{/* <span>{message.status}</span>
		<span>{message.arguments}</span> */}
	</div>;
}