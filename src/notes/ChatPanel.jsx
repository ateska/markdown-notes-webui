import React, { useState, useRef, useEffect } from 'react';
import {
	Button, Input,
	Spinner,
	Card, CardHeader, CardBody,
	Collapse,
	Container, Row, Col,
} from 'reactstrap';

import { useAppSelector, FullscreenButton } from 'asab_webui_components';

import { MarkdownComponent } from './MarkdownComponent.jsx';

import './ChatPanel.scss';

export default function ChatPanel({ app, notePath }) {
	const tenant = useAppSelector(state => state.tenant?.current);
	const MarkdownNotesAPI = app.axiosCreate("markdown-notes");

	const [conversationId, setConversationId] = useState(undefined);
	const [items, setItems] = useState(undefined);
	const [inputValue, setInputValue] = useState('');
	const [activeTasks, setActiveTasks] = useState(0);
	const [cardFullscreen, setCardFullscreen] = useState(false);
	const [model, setModel] = useState(undefined);

	const inputRef = useRef(null);
	const chatBottomRef = useRef(null);
	const controllerRef = useRef(null);

	const websocketRef = useRef(null);

	// This is a reply message from the LLM conversation service to the client.
	const handleReply = (message) => {

		switch (message.type) {

			case 'chat.mounted':
				setConversationId(message.conversation_id);
				setModel(message.model);
				return;

			case 'tasks.updated':
				setActiveTasks(message.count);
				return;

			case 'update.full':
				setConversationId(message.conversation_id);
				setItems(message.items);
				return;

			case 'item.appended':
				setItems(prev => [
					...prev,
					message.item,
				]);
				chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
				return;

			case 'item.delta':
				setItems(prev => [
					...prev.map(
						originalMessage => originalMessage.key === message.key
						? { ...originalMessage, content: originalMessage.content + message.delta }
						: originalMessage
					),
				]);
				chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
				return;

			case 'item.updated':
				setItems(prev => [
					...prev.map(
						originalMessage => originalMessage.key === message.item.key
						? message.item
						: originalMessage
					),
				]);
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
			if (conversationId) {
				param = `?conversation_id=${conversationId}`;
			} else {
				param = '';
			}

			const websocket = app.createWebSocket("markdown-notes", `${tenant}/llm/conversation${param}`);
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
		setActiveTasks(1); // One active task - will be replaced by the info from the LLM conversation service
		setInputValue('');


		websocketRef.current?.send(JSON.stringify({
			type: 'user.message.created',
			content: userMessage,
			model: model,
		}));
	}

	const handleReset = () => {
		setItems([]);
		setConversationId(undefined);
		setModel(undefined);
		websocketRef.current?.close(); // Force to reconnect the websocket
	}

	return (<Card className={`h-100 ${cardFullscreen ? 'card-fullscreen' : ''}`}>
		<CardHeader className='card-header-flex'>
			<div className='flex-fill'>
				<h3 title={conversationId ? `Conversation ID: ${conversationId}` : ''}>
					<i className="bi bi-robot me-2"></i>
					Assistant
				</h3>
			</div>
			<Button
				color="warning"
				outline
				title="Reset the chat"
				onClick={handleReset}>
				<i className="bi bi-x-lg"></i>
			</Button>
			<FullscreenButton fullscreen={cardFullscreen} setFullscreen={setCardFullscreen} />
		</CardHeader>
		<CardBody className="overflow-scroll">
			<Container className="p-0">
				{items?.map((item) => (
					<Item key={item.key} app={app} item={item} />
				))}

				{activeTasks > 0
					? <Row>
						<Col>
							<Spinner size="sm" className="ms-2 me-2" />
							<span className="text-muted" title={`${activeTasks} tasks`}>Working ...</span>
						</Col>
						<Col className="text-end">
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
						</Col>
					</Row>

					: <>
						<Row>
							<Col>
								<Input
									innerRef={inputRef}
									type="textarea"
									rows="1"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									placeholder="Type your message..."
									disabled={conversationId === undefined}
									className="chat-input"
									style={{ overflow: 'hidden', resize: 'none' }}
								/>
							</Col>
						</Row>
						<Row>
							<Col className="text-muted" style={{ fontSize: '0.8em', paddingTop: '4px' }} title="Model used for the chat">
								{model && <>
									<i className="bi bi-robot me-2"></i>
									{model}
								</>}
							</Col>
							<Col xs={2} className="text-end">
								<Button
								color="link"
								onClick={handleSend}
								disabled={!inputValue.trim()}
								size="sm"
								>
									<i className="bi bi-arrow-up-circle-fill"></i>
								</Button>
							</Col>
						</Row>
					</>
				}

				<div ref={chatBottomRef}>&nbsp;</div>

			</Container>
	
		</CardBody>
	</Card>);
}


const Item = ({ app, item }) => {
	switch (item?.type) {
		case 'error':
			return <ErrorMessage app={app} item={item} />;
		case 'reasoning':
			return <ReasoningMessage app={app} item={item} />;
		case 'message':
			switch (item?.role) {
				case 'user':
					return <UserMessage app={app} item={item} />;
				case 'assistant':
					return <AssistantMessage app={app} item={item} />;
				default:
					return <div>Unknown message role: {item?.role}</div>;
			}
		case 'function_call':
			return <FunctionCallMessage app={app} item={item} />;
		default:
			return <div>Unknown item type: {item?.type}</div>;
	}
};

function UserMessage({ app, item }) {
	return <Row data-item-key={item.key}>
		<Col>
			<div className="border p-2">
				{item?.content}
			</div>
		</Col>
	</Row>;
}

function AssistantMessage({ app, item }) {
	const notCompleted = item?.status !== 'completed';

	return <Row className="mt-2" data-item-key={item.key}>
		<Col>
			<MarkdownComponent>{item?.content}</MarkdownComponent>
			{notCompleted ? <i className="bi bi-pencil-fill animate-busy"></i> : null}
		</Col>
	</Row>;
}

function ReasoningMessage({ app, item }) {
	const notCompleted = item?.status !== 'completed';
	const [isReasoningOpen, setIsReasoningOpen] = useState(false);

	return <Row data-item-key={item.key}>
		<Col>
			<Button size="sm" className="text-muted ps-0" color="link" onClick={() => setIsReasoningOpen(!isReasoningOpen)}>
				<i className={`bi ${isReasoningOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
			</Button>
			<span className={`text-muted ${notCompleted ? 'animate-busy' : ''}`} style={{ fontSize: '0.8em' }}>Reasoning ...</span>
			<Collapse isOpen={isReasoningOpen} className="text-muted" style={{ fontSize: '0.8em' }}>
				<div style={{ whiteSpace: 'pre-wrap' }}>{item?.content || ''}</div>
			</Collapse>
		</Col>
	</Row>;
}

function FunctionCallMessage({ app, item }) {
	const notFinished = item?.status !== 'finished';
	const [isOpen, setIsOpen] = useState(false);

	return <Row data-item-key={item.key}>
		<Col className="text-muted" style={{ fontSize: '0.8em' }}>
			<Button size="sm" className="text-muted ps-0" color="link" onClick={() => setIsOpen(!isOpen)}>
				<i className={`bi ${isOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
			</Button>
			<span className={`${notFinished ? 'animate-busy' : ''}`} title={item.status}>Calling function <code>{item.name}</code> ...</span>
			{item.content && item.content.length > 0 && <Collapse isOpen={isOpen} className="text-muted" style={{ fontSize: '0.8em' }}>
				<code style={{ whiteSpace: 'pre-wrap' }}>{item.content}</code>
			</Collapse>}	
		</Col>
	</Row>;
}

function ErrorMessage({ app, item}) {
	return <div className="mb-3 text-danger">
		<i className="bi bi-exclamation-triangle me-1"></i>
		<span>Error: {item.content}</span>
	</div>;
}
