define(function () {
  return {
    apiUrl: document.location.origin + '/api',
    wsUrl: document.location.origin + ':8000',
    ioOptions: {
      'resource': 'api/socket.io'
    }
  };
});
