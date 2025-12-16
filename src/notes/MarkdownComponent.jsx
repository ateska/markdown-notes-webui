import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { defaultSchema } from 'hast-util-sanitize';

export function MarkdownComponent({ children }) {
	return (<Markdown
		remarkPlugins={[remarkGfm]}
		rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema]]}
		components={{
			a: (props) => {
				const {node, ...rest} = props;
				return <a
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
					target="_blank"
					rel="noopener noreferrer"
				/>
			},
			blockquote: (props) => {
				const {node, ...rest} = props;
				return <blockquote
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			br: (props) => {
				const {node, ...rest} = props;
				return <br
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			code: (props) => {
				const {node, ...rest} = props;
				return <code
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			em: (props) => {
				const {node, ...rest} = props;
				return <em
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			h1: (props) => {
				const {node, ...rest} = props;
				return <h1
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			h2: (props) => {
				const {node, ...rest} = props;
				return <h2
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			h3: (props) => {
				const {node, ...rest} = props;
				return <h3
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			h4: (props) => {
				const {node, ...rest} = props;
				return <h4
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			h5: (props) => {
				const {node, ...rest} = props;
				return <h5
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			h6: (props) => {
				const {node, ...rest} = props;
				return <h6
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			hr: (props) => {
				const {node, ...rest} = props;
				return <hr
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			img: (props) => {
				const {node, ...rest} = props;
				return <img
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			li: (props) => {
				const {node, ...rest} = props;
				return <li
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			ol: (props) => {
				const {node, ...rest} = props;
				return <ol
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			p: (props) => {
				const {node, ...rest} = props;
				return <p
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			pre: (props) => {
				const {node, ...rest} = props;
				return <pre
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			strong: (props) => {
				const {node, ...rest} = props;
				return <strong
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			ul: (props) => {
				const {node, ...rest} = props;
				return <ul
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			del: (props) => {
				const {node, ...rest} = props;
				return <del
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			table: (props) => {
				const {node, ...rest} = props;
				return <table
					{...rest}
					class="table"
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			tbody: (props) => {
				const {node, ...rest} = props;
				return <tbody
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			td: (props) => {
				const {node, ...rest} = props;
				return <td
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			th: (props) => {
				const {node, ...rest} = props;
				return <th
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			thead: (props) => {
				const {node, ...rest} = props;
				return <thead
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
			tr: (props) => {
				const {node, ...rest} = props;
				return <tr
					{...rest}
					data-start-line={node.position?.start.line}
					data-start-column={node.position?.start.column}
					data-end-line={node.position?.end.line}
					data-end-column={node.position?.end.column}
				/>
			},
		}}
	>
		{children}
	</Markdown>);
}
