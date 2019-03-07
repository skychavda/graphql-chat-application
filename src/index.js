import React from 'react';
import ReactDOM from 'react-dom';
// import './App.css';
import './stylesheets/main.css';
import {
  ApolloClient, InMemoryCache, HttpLink, split,
} from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import registerServiceWorker from './registerServiceWorker';
import App from './App';

const httpLink = new HttpLink({
  uri: 'http://192.168.1.116:8585/query',
});

const wsLink = new WebSocketLink({
  uri: 'ws://192.168.1.116:8585/query',
  options: {
    reconnect: true,
  },
});

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);

// const defaultOptions = {
//   watchQuery: {
//     fetchPolicy: 'network-only',
//     errorPolicy: 'ignore',
//   },
//   query: {
//     fetchPolicy: 'network-only',
//     errorPolicy: 'all',
//   },
// }

const client = new ApolloClient({ link, cache: new InMemoryCache(), queryDeduplication: false });

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root'),
);
registerServiceWorker();
