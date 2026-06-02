let provider;
let signer;

const btnConectar =
document.getElementById("btnConectar");

const direccion =
document.getElementById("direccion");

btnConectar.addEventListener(
    "click",
    conectarWallet
);

async function conectarWallet(){

    if(!window.ethereum){
        alert("MetaMask no está instalado");
        return;
    }

    provider =
        new ethers.BrowserProvider(
            window.ethereum
        );

    await provider.send(
        "eth_requestAccounts",
        []
    );

    signer =
        await provider.getSigner();

    const wallet =
        await signer.getAddress();

    direccion.textContent =
        "Conectado: " + wallet;

    console.log("Wallet:", wallet);
    console.log("Provider:", provider);
    console.log("Signer:", signer);
}

document
.getElementById("btnConsultarSaldo")
.addEventListener("click", () => {
    alert("Aquí se consultará el saldo LOT");
});

document
.getElementById("btnComprarTokens")
.addEventListener("click", () => {
    alert("Aquí se ejecutará comprarTokens()");
});

document
.getElementById("btnDevolverTokens")
.addEventListener("click", () => {
    alert("Aquí se ejecutará devolverTokens()");
});

document
.getElementById("btnComprarBoletos")
.addEventListener("click", () => {
    alert("Aquí se ejecutará comprarBoletos()");
});

document
.getElementById("btnConsultarBoletos")
.addEventListener("click", () => {
    alert("Aquí se consultarán los boletos NFT");
});