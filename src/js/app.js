App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,

    init: () => {
        console.log("App initialized...")
        return App.initWeb3();
    },
    initWeb3: () => {
        if (typeof web3 !== 'undefined') {
            // If web3 instance is already providede by metamask
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider)
        }
        return App.initContracts();
    },
    initContracts: () => {
        $.getJSON("DappTokenSale.json", dappTokenSale => {
            App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
            App.contracts.DappTokenSale.setProvider(App.web3Provider);
            App.contracts.DappTokenSale.deployed().then(dappTokenSale => {
                console.log("Dapp Token Sale Address", dappTokenSale.address);
            });
        }).done(() => {
            $.getJSON("DappToken.json", dappToken => {
                App.contracts.DappToken = TruffleContract(dappToken);
                App.contracts.DappToken.setProvider(App.web3Provider);
                App.contracts.DappToken.deployed().then(dappToken => {
                    console.log("Dapp Token Address", dappToken.address);
                });
                App.listenForEvents();
                return App.render();
            });
        });
    },

    // Listen for events emitted from the contract
    listenForEvents: () => {
        App.contracts.DappTokenSale.deployed().then(instance => {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch((error, event) => {
                console.log('event triggered ', event);
                App.render();
            })
        });
    },

    render: () => {
        if (App.loading) {
            return;
        }
        App.loading = true;
        var loader = $('#loader');
        var content = $('#content');

        loader.show();
        content.hide();
        // Load account data
        web3.eth.getCoinbase((err, account) => {
            if (err === null) {
                console.log("account: ", account);
                App.account = account;
                $('#accountAddress').html("Your Account: " + account);
            }
        })

        // Load the sale contract
        App.contracts.DappTokenSale.deployed().then(instance => {
            dappTokenSaleInstance = instance;
            return dappTokenSaleInstance.tokenPrice();
        }).then(tokenPrice => {
            App.tokenPrice = tokenPrice;
            $('.token-price').html(web3.fromWei(App.tokenPrice).toNumber());
            return dappTokenSaleInstance.tokensSold();
        }).then(tokensSold => {
            App.tokensSold = tokensSold.toNumber();
            App.tokensSold = tokensSold.toNumber();
            $('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent + '%');

            // Load the token contract
            App.contracts.DappToken.deployed().then(instance => {
                dappTokenInstance = instance;
                return dappTokenInstance.balanceOf(App.account);
            }).then(balance => {
                $('.dapp-balance').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            });
        });
    },

    buyTokens: () => {
        $('#content').hide();
        $('#loader').show();
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.DappTokenSale.deployed().then(instance => {
            return instance.buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000
            });
        }).then(result => {
            console.log("Tokens bought...")
            $('form').trigger('reset') // reset number of tokens in the form
            // Wait for sell event to triggger
        });
    }
}

$(() => {
    $(window).load(() => {
        App.init();
    })
});