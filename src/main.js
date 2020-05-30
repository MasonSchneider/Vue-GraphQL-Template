import Vue from 'vue';
import { InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import VueApollo from 'vue-apollo';
import { CachePersistor } from 'apollo-cache-persist';
import createAuth0Client from '@auth0/auth0-spa-js';
import { setContext } from 'apollo-link-context';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';

import { domain, clientId, audience } from '../auth_config.json';
import { Auth0Plugin } from './auth';

createAuth0Client({
  domain,
  client_id: clientId,
  audience,
  redirect_uri: window.location.origin,
  responseType: 'id_token',
}).then((c) => {
  const auth0Client = c;

  Vue.use(Auth0Plugin, {
    client: c,
    onRedirectCallback: (appState) => {
      router.push(
        appState && appState.targetUrl
          ? appState.targetUrl
          : window.location.pathname,
      );
    },
  });

  // Apollo config
  const httpLink = new HttpLink({
    uri: 'HASURA_LINK',
    fetchOptions: { credentials: 'same-origin' },
  });

  let token;

  const withTokenLink = setContext(async () => {
    // return token if there
    if (token) return { auth0Token: token };

    // else check if valid token exists with client already and set if so
    const newToken = await auth0Client.getTokenSilently();
    token = newToken;
    return { auth0Token: newToken };
  });

  const authLink = setContext((_, { headers, auth0Token }) => ({
    headers: {
      ...headers,
      ...(auth0Token ? { authorization: `Bearer ${auth0Token}` } : {}),
    },
  }));

  const link = ApolloLink.from([withTokenLink, authLink, httpLink]);

  const cache = new InMemoryCache({
    addTypename: true,
  });

  const client = new ApolloClient({
    link,
    cache,
  });

  const persistor = new CachePersistor({ cache, storage: window.localStorage });

  Vue.use(VueApollo);

  const apolloProvider = new VueApollo({
    defaultClient: client,
  });

  Vue.config.productionTip = false;

  persistor.restore().then(() => {
    new Vue({
      router,
      store,
      apolloProvider,
      render: (h) => h(App),
    }).$mount('#app');
  });
});
