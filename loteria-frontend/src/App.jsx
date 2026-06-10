import "./App.css";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

function App() {
  const [wallet, setWallet] = useState("No conectado");
  const [nombre, setNombre] = useState("-");
  const [simbolo, setSimbolo] = useState("-");
  const [totalSupply, setTotalSupply] = useState("-");
  const [saldo, setSaldo] = useState("0");
  const [cantidadTokens, setCantidadTokens] = useState("");
  const [cantidadBoletos, setCantidadBoletos] = useState("");
  const [boletosVendidos, setBoletosVendidos] = useState("0");
  const [misBoletos, setMisBoletos] = useState([]);
  const [ganador, setGanador] = useState("Sin ganador");
  const [premio, setPremio] = useState("0");

  async function conectarWallet() {

  if (!window.ethereum) {
    alert("MetaMask no está instalado");
    return;
  }

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  await provider.send(
    "eth_requestAccounts",
    []
  );

  const signer =
    await provider.getSigner();

  const address =
    await signer.getAddress();

  setWallet(address);

  await cargarDatosContrato();

  console.log(address);
}

async function cargarDatosContrato() {

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

  const nombreToken =
    await contrato.name();

  const simboloToken =
    await contrato.symbol();

  const supply =
    await contrato.totalSupply();

  setNombre(nombreToken);
  setSimbolo(simboloToken);
  setTotalSupply(
    ethers.formatUnits(supply, 18)
  );

  console.log(nombreToken);
  console.log(simboloToken);
  console.log(supply.toString());
  await consultarBoletosVendidos();
  await consultarGanador();
  await consultarPremio();
}

async function consultarPremio() {

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const balance =
    await provider.getBalance(
      CONTRACT_ADDRESS
    );

  setPremio(
    ethers.formatEther(balance)
  );
}
async function consultarSaldo() {

  if (!window.ethereum || wallet === "No conectado") {
    alert("Conecta primero la wallet");
    return;
  }

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

  const balance =
    await contrato.balanceOf(wallet);

  setSaldo(
    ethers.formatUnits(balance, 18)
  );
}

async function comprarTokens() {

  if (!window.ethereum) {
    alert("MetaMask no está instalada");
    return;
  }

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const signer =
    await provider.getSigner();

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

  try {

    const cantidad =
      Number(cantidadTokens);

    const costo =
      (cantidad * 0.001).toString();

    const tx =
      await contrato.comprarTokens(
        cantidad,
        {
          value: ethers.parseEther(costo)
        }
      );

    await tx.wait();

    alert("Tokens comprados correctamente");

    consultarSaldo();

  } catch (error) {

    console.error(error);

    alert("Error al comprar tokens");
  }
}

async function comprarBoletos() {

  if (!window.ethereum) {
    alert("MetaMask no está instalada");
    return;
  }

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const signer =
    await provider.getSigner();

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

  try {

    const cantidad =
      Number(cantidadBoletos);

    const tx =
      await contrato.comprarBoletos(
        cantidad
      );

    await tx.wait();
    await consultarSaldo();
    await consultarBoletosVendidos();
    await consultarMisBoletos();

    alert("Boletos comprados correctamente");

  } catch (error) {

    console.error(error);

    alert("Error al comprar boletos");
  }
}

async function consultarBoletosVendidos() {

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

  const total =
    await contrato.totalBoletosVendidos();

  setBoletosVendidos(total.toString());
}

async function consultarMisBoletos() {

  if (wallet === "No conectado") {
    alert("Conecta primero la wallet");
    return;
  }

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

  try {

    const boletos =
      await contrato.boletosDeUsuario(wallet);

    const boletosConvertidos =
      boletos.map(b => b.toString());

    setMisBoletos(
      boletosConvertidos
    );

  } catch(error) {

    console.error(error);

    setMisBoletos([]);
  }
}

async function consultarGanador() {

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

  const ganadorAddress =
    await contrato.ganador();

  if (
    ganadorAddress ===
    "0x0000000000000000000000000000000000000000"
  ) {

    setGanador("Sin ganador");

  } else {

    setGanador(ganadorAddress);

  }
}

async function generarGanador() {

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const signer =
    await provider.getSigner();

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

  try {

    const tx =
      await contrato.seleccionarGanador();

    await tx.wait();

    alert("Ganador generado correctamente");

    await consultarGanador();

  } catch(error) {

    console.error(error);

    alert("Error al generar ganador");
  }
}
async function reiniciarLoteria() {

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  const signer =
    await provider.getSigner();

  const contrato =
    new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

  try {

    const tx =
      await contrato.reiniciarLoteria();

    await tx.wait();

    alert("Lotería reiniciada");

    await consultarBoletosVendidos();
    setMisBoletos([]);
    await consultarGanador();
    await consultarBoletoGanador();

  } catch(error) {

    console.error(error);

    alert(
      "Solo el owner puede reiniciar la lotería"
    );
  }
}
  return (

    
    <div className="container">

      <h1> Lotería Descentralizada</h1>

      <p className="subtitulo">
        Compra tokens LOT, adquiere boletos NFT y participa por el premio.
      </p>
    <div className="dashboard">

      <div className="card">
        <h2> Estadísticas</h2>

        <p className="info">
          Premio acumulado: <strong>{premio} ETH</strong>
        </p>

        <p className="info">
          Boletos vendidos: <strong>{boletosVendidos}</strong>
        </p>

        <p className="info">
          Usuarios registrados: <strong>0</strong>
        </p>
      </div>

      <div className="card">
        <h2>Wallet</h2>

        <div className="grid">
          <button onClick={conectarWallet}>
            Conectar MetaMask
          </button>

          <p>
            {wallet}
          </p>
        </div>
      </div>
      <div className="card">
         <h2>Información del Token</h2>
         <p>Nombre: {nombre}</p>
         <p>Símbolo: {simbolo}</p>
         <p>Total Supply: {totalSupply}</p>
         </div>

      <div className="card">
        <h2>Saldo de Tokens</h2>

        <div className="grid">
          <p>{saldo} LOT</p>

          <button onClick={consultarSaldo}  >
            Consultar saldo
          </button>
        </div>
      </div>

      <div className="card">

  <h2>Comprar Tokens</h2>

  <div className="grid">

    <input
      type="number"
      placeholder="Cantidad de tokens"
      value={cantidadTokens}
      onChange={(e) =>
        setCantidadTokens(e.target.value)
      }
    />

    <button onClick={comprarTokens}>
      Comprar Tokens
    </button>

  </div>

  

</div>
  
<div className="card">

  <h2>Comprar Boletos</h2>

  <div className="grid">

    <input
      type="number"
      placeholder="Cantidad de boletos"
      value={cantidadBoletos}
      onChange={(e) =>
        setCantidadBoletos(e.target.value)
      }
    />

    <button onClick={comprarBoletos}>
      Comprar Boletos
    </button>

  </div>
</div>

<div className="card">

  <h2>Mis Boletos NFT</h2>

  <button onClick={consultarMisBoletos}>
    Ver mis boletos
  </button>

  <ul>
    {misBoletos.map((boleto) => (
      <li key={boleto}>
        Boleto #{boleto}
      </li>
    ))}
  </ul>

</div>

<div className="card">

  <h2>Ganador</h2>

  <p>{ganador}</p>

  <button onClick={consultarGanador}>
    Actualizar ganador
  </button>

  <button onClick={generarGanador}>
    Generar ganador
  </button>

</div>


<div className="card">

  <h2> Reiniciar Lotería</h2>


  <button onClick={reiniciarLoteria}>
  Reiniciar Lotería
  </button>



</div>
    </div>

    </div>

    
  );
}

export default App;