# Roadmap 
The order of this list may not reflect the order in which those functionalities will be implemented  
  
- page with some useful info: current blockchain height, last block time...
- adding the wallet balance in the side menu
- qr code scanning on send page
- include subaddress support
- drive storage for synchronisation (http://remotestoragejs.readthedocs.io/en/latest/index.html)
- wallet translation in multiple languages (will include date and number format)
- wasm to improve speed
- web mining directly included
- receive page: add payment id support
- receive page: add mempool check (only when payment id) & progression
- better backup method for storing his keys (https://parall.ax/products/jspdf)
- offline payment made easier
- p2p connection between a computer and another device(phone, ...) for a sync method (to reduce the heat on small devices)
- and in the "long term" (3/6 month) it will connect directly on a masarid ! (i will work with the others (thaer, crypto) to improve the rpc so allow it)
- disable the scanning of miner tx (to gain some performance as only a few people are actually solo mining)
- integrated mining client (already have a working version)
- improve tx fee calculation
- detect when multiple tabs are open to prevent data collision
- continue to scan while the page is not focused

# Bugs & things to improve
- errors on importing : no windows sometimes
- password strength : disclaimer but allow not strong password ?
- triangular distribution over [a,b) with a=0, mode c=b=up_index_limit

# Ideas, thoughts, links
- take a small fee on each payment to cover server expenses
- https://www.reddit.com/r/Monero/comments/8h1t2i/article_explaining_how_monerujos_upcoming/
- https://www.reddit.com/r/Monero/comments/5fybe7/mymonero_is_now_available_as_a_chrome_extension/
- An introduction to content security policy (html5 rocks)
- subresource integrity (webdevelopper mozilla)