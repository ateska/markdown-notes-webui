const initialState = {
	tree: "init", // Will be replaced by the array of the actual tree
}

export default (state = initialState, action) => {
	switch (action.type) {
		case "markdown-notes/setTree":
			return {
				...state,
				tree: action.payload
			};
		default:
			return state;
	}
};
