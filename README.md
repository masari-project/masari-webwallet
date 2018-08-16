# Official Masari Web Wallet - Fully client-side 
This web wallet is doing everything client-side to give the best privacy to users.
The server is currently only used to optimize the communication with the daemon and compress the blockchain.  

Note: This requirement may be removed in the future once daemons evolve and return enough data.  

# Security
**No keys, seeds, or sensitive data is sent to the server**  
If you find a potential security issue, please contact me so we/I can patch it as soon as possible.  
Encryption is done with a certified library, [Tweetnacl.Js.](https://github.com/dchest/tweetnacl-js)

# Contributors and thanks
Developers:
- gnock (main)
- cryptochangements

Translations:
- English: too many people
- French: gnock
- Serbian cyrillic: girugameshh
- German: F0sching
- Hungarian: Gelesztaa

# Contributing
- You can help Masari by translation the wallet in your native language, it's really easy!  
Read [the translations guide](TRANSLATIONS.md) to get instructions on how to do that
- Report bugs & ideas to help us improve the web wallet by opening an issue 
- [Make a donation to Masari](https://www.masariwallet.com/#!donate)

# Forks / Other Coins
We have been receiving multiple coin developers help to fork it. As the time required to develop this project is heavy, please consider giving a mention to this project if you fork it.

If you are a developer of a Cryptonote/Monero fork and would like to get a fork, please contact us (@gnock on the [official Discord](https://discord.gg/eSb9ZdM)).

Depending on your coin specifics, I can provide support, maintenancem and development/updates for a payment in return - crypto only.
If you are not willing to pay for this service, please do not contact us and make us lose time.

The code is readable, it should be enough for you to use it.

# Features (non-exhaustive)
- Complete wallet sync without server side processing for security
- Receive/send history
- Mempool support to check incoming transfers
- Send coins - including QR code scanning and subaddress support
- Receive page to generate a custom QR code
- Import from private keys, mnemonic seed, or json file (exported by the wallet)
- Export private keys, mnemonic phrase, or json file (which include all the history)
- View only wallet
- Basic network stats

# Roadmap
See Github [issues.](https://github.com/masari-project/masari-webwallet/issues)
