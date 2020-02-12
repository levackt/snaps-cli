const { errors: rpcErrors } = require('eth-json-rpc-errors')

wallet.registerRpcMessageHandler(async (_originString, requestObject) => {
  switch (requestObject.method) {

    case 'signTypedDataV4Message':
      const amount = requestObject.params[0]
      const encRecipient = requestObject.params[1]
      const pubKey = requestObject.params[2]

      // todo sender from account
      const sender = requestObject.params[3]

      
      // todo get the chainId
      // const chainId = this.provider.getNetwork().then(function (network) { return network.chainId; });
      const chainId = "4"

      const depositData = {sender, amount, encRecipient, pubKey}

      const data = buildDepositTypedData(depositData, chainId)

      const approved = await promptUser(`Do you want to sign?`)
      if (!approved) {
        throw rpcErrors.eth.unauthorized()
      }

      const params = {
        data: JSON.stringify(data), 
        from: sender
      }
      return wallet.send('eth_signTypedData_v4', params)

    default:
      throw rpcErrors.methodNotFound(requestObject)
  }
})

function buildDepositTypedData(payload, chainId) {
        const {sender, amount, encRecipient, pubKey} = payload;
        
        return {
            types: {
                EIP712Domain: [
                    {name: 'name', type: 'string'},
                    {name: 'version', type: 'string'},
                    {name: 'chainId', type: 'uint256'},
                ],
                Deposit: [
                    {name: 'sender', type: 'address'},
                    {name: 'amount', type: 'uint256'},
                    {name: 'encRecipient', type: 'bytes'},
                    {name: 'pubKey', type: 'bytes'},
                ],
            },
            primaryType: 'Deposit',
            domain: {
                name: 'Salad Deposit',
                version: '1',
                chainId,
            },
            message: {
                sender,
                amount,
                encRecipient,
                pubKey
            },
        };
    }

async function getPubKey () {
  const PRIV_KEY = await wallet.getAppKey()
  return bls.getPublicKey(PRIV_KEY)
}

async function promptUser (message) {
  const response = await wallet.send({ method: 'confirm', params: [message] })
  return response
}

