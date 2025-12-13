import React, { useState, useRef, useEffect } from 'react';
import {
	Card, CardHeader, CardBody,
	Button, Input, InputGroup,
	Spinner
} from 'reactstrap';
import { useAppSelector } from 'asab_webui_components';
import { MarkdownComponent } from './MarkdownComponent.jsx';
import './ChatPanel.scss';

export default function ChatPanel({ app }) {
	const tenant = useAppSelector(state => state.tenant?.current);
	const [messages, setMessages] = useState([]);
	const [inputValue, setInputValue] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSend = async () => {
		if (!inputValue.trim() || isLoading) return;

		const userMessage = inputValue.trim();
		setInputValue('');
		
		// Add user message
		const newUserMessage = {
			id: Date.now(),
			role: 'user',
			content: userMessage,
			timestamp: new Date()
		};
		
		setMessages(prev => [...prev, newUserMessage]);
		setIsLoading(true);

		try {
			// TODO: Replace with actual LLM API endpoint
			// For now, simulate a response
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const assistantMessage = {
				id: Date.now() + 1,
				role: 'assistant',
				content: `I received your message: "${userMessage}". This is a placeholder response. Please connect this to your LLM API endpoint.`,
				timestamp: new Date()
			};
			
			setMessages(prev => [...prev, assistantMessage]);
		} catch (err) {
			console.error('Failed to send message:', err);
			const errorMessage = {
				id: Date.now() + 1,
				role: 'assistant',
				content: 'Sorry, I encountered an error processing your request. Please try again.',
				timestamp: new Date(),
				isError: true
			};
			setMessages(prev => [...prev, errorMessage]);
			app.addAlertFromException(err, 'Failed to send message');
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleClear = () => {
		setMessages([]);
	};

	return (
		<Card className="h-100 chat-panel-card">
			<CardHeader className="chat-header d-flex justify-content-between align-items-center">
				<div className="d-flex align-items-center">
					<i className="bi bi-chat-left-text me-2"></i>
					<h5 className="mb-0">LLM Chat</h5>
				</div>
				{messages.length > 0 && (
					<Button
						color="link"
						size="sm"
						onClick={handleClear}
						className="text-muted"
						title="Clear chat"
					>
						<i className="bi bi-trash"></i>
					</Button>
				)}
			</CardHeader>
			
			<CardBody className="chat-body p-0 d-flex flex-column">
				<div className="chat-messages flex-fill">
					{messages.length === 0 ? (
						<div className="chat-empty-state">
							<i className="bi bi-chat-dots"></i>
							<p>Start a conversation with the LLM</p>
							<small className="text-muted">Ask questions or request assistance</small>
						</div>
					) : (
						<div className="messages-container">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`message message-${message.role} ${message.isError ? 'message-error' : ''}`}
								>
									<div className="message-avatar">
										{message.role === 'user' ? (
											<i className="bi bi-person-circle"></i>
										) : (
											<i className="bi bi-robot"></i>
										)}
									</div>
									<div className="message-content">
										<div className="message-header">
											<span className="message-role">
												{message.role === 'user' ? 'You' : 'Assistant'}
											</span>
											<span className="message-time">
												{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
										</div>
										<div className="message-text">
											{message.role === 'assistant' ? (
												<MarkdownComponent app={app}>{message.content}</MarkdownComponent>
											) : (
												<p className="mb-0">{message.content}</p>
											)}
										</div>
									</div>
								</div>
							))}
							{isLoading && (
								<div className="message message-assistant">
									<div className="message-avatar">
										<i className="bi bi-robot"></i>
									</div>
									<div className="message-content">
										<div className="message-header">
											<span className="message-role">Assistant</span>
										</div>
										<div className="message-text">
											<Spinner size="sm" className="me-2" />
											<span className="text-muted">Thinking...</span>
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>
				
				<div className="chat-input-container">
					<InputGroup>
						<Input
							innerRef={inputRef}
							type="textarea"
							rows="3"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
							disabled={isLoading}
							className="chat-input"
						/>
						<Button
							color="primary"
							onClick={handleSend}
							disabled={!inputValue.trim() || isLoading}
							className="chat-send-button"
						>
							{isLoading ? (
								<Spinner size="sm" />
							) : (
								<i className="bi bi-send"></i>
							)}
						</Button>
					</InputGroup>
				</div>
			</CardBody>
		</Card>
	);
}
