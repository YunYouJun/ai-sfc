const json = JSON.stringify({
  code: 0,
  message: 'Hello World',
})

// eslint-disable-next-line unused-imports/no-unused-vars
export function onRequest(context) {
  return new Response(json, {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'x-edgefunctions-test': 'Welcome to use Pages Functions.',
    },
  })
}
