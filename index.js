var needle = require('needle');
needle.defaults({
  user_agent: 'SymphonyBot/0.0.1',
  json: true
});

var config;

var symphony = {
		_tokens: {

		},
		authenticate: function() {
			var options = {
				timeout: 35000, 
				cert: config.bot.cert, 
				key: config.bot.key
			};
			
			console.log('Authenticating:',new Date());

			return needle('post',config.endpoints.session,null,options)
				.then(function(resp) {				
					if(resp.statusCode == 200) {
						// save sessionToken
						symphony._tokens.sessionToken = resp.body.token;
						return needle('post',config.endpoints.keymanager,null,options)
							.then(function(resp) {
								// save keyManagerToken
								symphony._tokens.keyManagerToken = resp.body.token;		
								return symphony._tokens;		
							});
					} else {
						console.error(resp.statusCode + ' : ' + resp.statusMessage);
						return resp.body;
					}
				});
		},

		appauth: function(data) {
			var options = {
				timeout: 35000, 
				cert: config.bot.cert, 
				key: config.bot.key,
				headers: {
					"content-type": "application/json",
					"cache-control": "no-cache"
				  } 
			};
			
			return needle('post',config.endpoints.session+'/extensionApp',data,options)
				.then((resp) => {				
					console.log(resp.statusCode);
					return {
						statusCode: resp.statusCode,
						statusMessage: resp.statusMessage,
						body: resp.body
					};
				});
		},

		_apicall: function(method,url,data) {
			var options = { 
				timeout: 35000, 
				headers: { 
					'content-type': 'application/json',
					"cache-control": "no-cache" 
				}
			};

			if(symphony._tokens && symphony._tokens.sessionToken && symphony._tokens.keyManagerToken) {
			// If we have cached tokens, then try using them, if fail, reauth and try call again
				options.headers.sessionToken = symphony._tokens.sessionToken;
				options.headers.keyManagerToken = symphony._tokens.keyManagerToken;
				return needle(method,url,data,options)
					.then(function(resp) {
						if(resp.statusCode == 401) {							
							return symphony.authenticate().then(function(tokens) {
								options.headers.sessionToken = tokens.sessionToken;
								options.headers.keyManagerToken = tokens.keyManagerToken;
								// only retry once to avoid infinite loop
								return needle(method,url,data,options)
									.then(function(resp) {
										if(resp.statusCode == 200) return resp.body;
										else return Promise.reject({
											statusCode: resp.statusCode,
											statusMessage: resp.statusMessage,
											body: resp.body
										});
									}); 
							});
						}
						if(resp.statusCode == 200) return resp.body;
						else return Promise.reject({
							statusCode: resp.statusCode,
							statusMessage: resp.statusMessage,
							body: resp.body
						});
					});
			} else {
			// otherwise simply auth first and then make call	
				return symphony.authenticate().then(function(tokens) {
					options.headers.sessionToken = tokens.sessionToken;
					options.headers.keyManagerToken = tokens.keyManagerToken;
					return needle(method,url,data,options)
						.then(function(resp) {
							if(resp.statusCode == 200) return resp.body;
							else return Promise.reject({
									statusCode: resp.statusCode,
									statusMessage: resp.statusMessage,
									body: resp.body
								});
						});
				});
			}
		},

		healthcheck: function() {	
			return symphony._apicall('get',config.endpoints.agent + '/v2/HealthCheck');
		},

		sessioninfo: function() {
			return symphony._apicall('get',config.endpoints.pod + '/v2/sessioninfo');
		},

		echo: function(message) {
			var data = {message : message};
			return symphony._apicall('post',config.endpoints.agent + '/v1/util/echo',data);
		},

		userLookup: function(type,lookup,local) {
			if(!local) local = false;
			query = `${type}=${lookup}&local=${local}`;
			return symphony._apicall('get',config.endpoints.pod + `/v2/user?${query}`);
		},

		userLookupv3: function(type,lookup,local) {
			if(!local) local = false;
			if(lookup && Array.isArray(lookup)) lookup = lookup.join();
			query = `${type}=${lookup}&local=${local}`;
			return symphony._apicall('get',config.endpoints.pod + `/v3/users?${query}`);
		},

		userstreams: function(data) {
			// {"streamTypes":[{"type":"IM"}],"includeInactiveStreams":true}
			return symphony._apicall('post',config.endpoints.pod + '/v1/streams/list',data);
		},

		streaminfo: function(sid) {
			return symphony._apicall('get',config.endpoints.pod + `/v1/streams/${sid}/info`);
		},

		roominfo: function(sid) {
			return symphony._apicall('get',config.endpoints.pod + `/v2/room/${sid}/info`);
		},

		createfeed_v4: function() {
			return symphony._apicall('post',config.endpoints.agent + `/v4/datafeed/create`,null);
		},
		readfeed_v4: function(id) {
			return symphony._apicall('get',config.endpoints.agent + `/v4/datafeed/${id}/read`);
		},

		createfeed_v2: function() {
			return symphony._apicall('post',config.endpoints.agent + `/v1/datafeed/create`,null);
		},
		readfeed_v2: function(id) {
			return symphony._apicall('get',config.endpoints.agent + `/v2/datafeed/${id}/read`);
		},

		sendsimplemessagev2: function(sid,message) {
			return symphony._apicall('post',config.endpoints.agent + `/v2/stream/${sid}/message/create`,{message : `<messageML>${message}</messageML>`, format : 'MESSAGEML'});
		},

		sendsimplemessagev4: function(sid,message) {
			return symphony._apicall('post',config.endpoints.agent + `/v4/stream/${sid}/message/create`,{message : `<messageML>${message}</messageML>`});
		},

		listConnections: function(status,userIds) {
			if(!status) status = 'all';
			if(!userIds) userIds = [];
			if(userIds && Array.isArray(userIds)) userIds = userIds.join();
			return symphony._apicall('get',config.endpoints.pod + `/v1/connection/list?status=${status}&userIds=${userIds}`);
		},
		acceptConnection: function(userId) {
			return symphony._apicall('post',config.endpoints.pod + `/v1/connection/accept`,{userId : userId});
		},
		connection: function(userId) {
			return symphony._apicall('get',config.endpoints.pod + `/v1/connection/user/${userId}/info`);
		},
	}

module.exports = function (_config) {
	if(_config) { 
		config = _config;
	}
	return symphony; 
};