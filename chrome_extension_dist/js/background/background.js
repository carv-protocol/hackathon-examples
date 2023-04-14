const BACKEND_API = 'https://api-dev.carv.io';
const REDIRECT_URL = 'http://localhost:3333/auth';

function fetchGet(url, init = {}) {
  return fetch(url, {
    method: 'GET',
    ...init,
  }).then(res => res.json());
}

function fetchPost(url, body) {
  return fetch(url, {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(res => res.json());
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('收到来自content-script的消息：');
  console.log(request, sender, sendResponse);

  const { type, data } = request;

  if (type === 'requestOpenLink') {
    if (data.type === 'twitter') {
      fetch(
        `${BACKEND_API}/community/twitter/login/authorization?redirect=${REDIRECT_URL}`
      )
        .then(res => res.json())
        .then(res => sendResponse(res));
    }
  }

  if (type === 'requestTokenLogin') {
    const res = data;
    if (res.code === 0) {
      const token = res.data.token;

      if (token) {
        fetch(`${BACKEND_API}/users/profile?user_id=me`, {
          headers: {
            authorization: token,
          },
        })
          .then(res => res.json())
          .then(res => sendResponse(res));
      }
    } else if (res.code === 2040) {
      sendResponse(res);
      // const client_id = res.data.client_id;
      // if (client_id) {
      //   setClientId(client_id);
      // } else {
      //   toast.error('client_id is empty');
      // }
    } else {
      sendResponse(res);
    }
  }

  if (type === 'requestWalletLogin') {
    fetchPost(`${BACKEND_API}/auth/login`, data).then(res => {
      if (res.code === 0) {
        fetchGet(`${BACKEND_API}/users/profile?user_id=me`, {
          headers: {
            authorization: res.data.token,
          },
        }).then(res => {
          sendResponse(res);
        });
      }
    });
  }
  if (type === 'requestCreateNewAccount') {
    fetchPost(`${BACKEND_API}/community/signup`, data).then(res => {
      if (res.code === 0) {
        fetchGet(`${BACKEND_API}/users/profile?user_id=me`, {
          headers: {
            authorization: res.data.token,
          },
        }).then(res => {
          sendResponse(res);
        });
      }
    });
  }

  // 返回 true，表示我们将异步地使用 sendResponse
  return true;
});