export type AccessToken = {
	/** The token used to access the Spotify Web API */
	access_token: string;
	/** The type of token which is of type bearer */
	token_type: string;
	/** The time after which the access token expires */
	expires_in: number;
	scope: string;
};
