import JSONBig from 'bigint-json-native';
Instagram = {};

Oauth.registerService('instagram', 2, null, function(query) {
  var oauthResponse = getTokenResponse(query);
  const instagramUser = getUserInfo(oauthResponse.user_id, oauthResponse.access_token);

  var serviceData = {
    ...instagramUser,
    accessToken: oauthResponse.access_token,
  };
  return {
    serviceData: serviceData,
  };
});

const getUserInfo = (userID, accessToken) => {
  const GRAPH_URL = "https://graph.instagram.com/"
  const URL = `${GRAPH_URL}/${userID}`;
  const params = {
    fields: "id,username,media_count,account_type",
    access_token: accessToken,
  };

  let instagramUser;
  try {
    const result = HTTP.get(URL, {params});
    if (result.statusCode !== 200) {
      console.error(result);
      return;
    }
    instagramUser = result.data;
  } catch (e) {
    console.error(e);
  }

  return instagramUser;
};

var getTokenResponse = function (query) {
  var config = ServiceConfiguration.configurations.findOne({service: 'instagram'});

  if (!config)
    throw new ServiceConfiguration.ConfigError();

  var response;
  try {
    response = HTTP.post(
      "https://api.instagram.com/oauth/access_token", {
        params: {
          code: query.code,
          client_id: config.clientId,
          redirect_uri: OAuth._redirectUri("instagram", config),
          client_secret: OAuth.openSecret(config.secret),
          grant_type: 'authorization_code'
        }
      });

    if (response.error) // if the http response was an error
        throw response.error;
    if (typeof response.content === "string")
        response.content = JSONBig.parse(response.content);
    if (response.content.error)
        throw response.content;
  } catch (err) {
    throw _.extend(new Error("Failed to complete OAuth handshake with Instagram. " + err.message),
                   {response: err.response});
  }

  return response.content;
};

Instagram.retrieveCredential = function(credentialToken, credentialSecret) {
  return Oauth.retrieveCredential(credentialToken, credentialSecret);
};

export {getTokenResponse, getUserInfo};
