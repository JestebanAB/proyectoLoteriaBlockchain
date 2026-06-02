// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BoletosNFT is ERC721, Ownable {
    uint private _nextId = 1;

    constructor() ERC721("BoletoDeLoteria", "BLOT") Ownable(msg.sender) {}

    function mintBoleto(address to) external onlyOwner returns (uint) {
        uint id = _nextId++;
        _safeMint(to, id);
        return id;
    }
}

contract ContratoUsuario {
    address public usuario;
    uint[] public boletos;

    constructor(address _usuario) {
        usuario = _usuario;
    }

    function agregarBoleto(uint tokenId) external {
        boletos.push(tokenId);
    }

    function listarBoletos() external view returns (uint[] memory) {
        return boletos;
    }
}

contract ProyectoLoteria is ERC20, Ownable {

    BoletosNFT public nftContract;

    uint256 public constant PRECIO_TOKEN = 1 ether;
    uint256 public constant PRECIO_BOLETO = 5 * 10**18;
    
    uint[] public boletosVendidos;
    bool public loteriaAbierta = true;

    mapping(address => address) public contratosAuxiliares;
    mapping(uint => address) public propietarioDelBoleto;

    address public ganador;
    uint public boletoPremiadoId;

    event TokensComprados(address indexed usr, uint cantidad);
    event Devolucion(address indexed usr, uint cantidad);
    event BoletosComprados(address indexed comprador, uint[] ids);
    event GanadorSeleccionado(address indexed ganador, uint boletoId, uint premio);
    event UsuarioRegistrado(address indexed usuario, address contrato);

    constructor() ERC20("LoteriaToken", "LOT") Ownable(msg.sender) {
        nftContract = new BoletosNFT();
        _mint(address(this), 10000 * 10**18);
    }

    function _registrarUsuario(address usr) internal {
        require(contratosAuxiliares[usr] == address(0), "ya registrado");
        ContratoUsuario c = new ContratoUsuario(usr);
        contratosAuxiliares[usr] = address(c);
        emit UsuarioRegistrado(usr, address(c));
    }

    function boletosDeUsuario(address usr) external view returns (uint[] memory) {
        require(contratosAuxiliares[usr] != address(0), "no registrado");
        return ContratoUsuario(contratosAuxiliares[usr]).listarBoletos();
    }

    function comprarTokens(uint256 cantidad) public payable {
        if (contratosAuxiliares[msg.sender] == address(0)) {
            _registrarUsuario(msg.sender);
        }

        uint256 monto = cantidad * 10**18;
        uint256 costo = cantidad * PRECIO_TOKEN;
        
        require(msg.value >= costo, "ether insuficiente");
        require(balanceOf(address(this)) >= monto, "tokens agotados");

        _transfer(address(this), msg.sender, monto);

        uint256 cambio = msg.value - costo;
        if (cambio > 0) {
            (bool enviado, ) = payable(msg.sender).call{value: cambio}("");
            require(enviado, "Error al enviar Ether");
        }

        emit TokensComprados(msg.sender, cantidad);
    }

    function devolverTokens(uint256 cantidad) public {
        require(cantidad > 0, "min 1");
        uint256 monto = cantidad * 10**18;
        require(balanceOf(msg.sender) >= monto, "saldo insuficiente");

        uint256 reembolso = cantidad * PRECIO_TOKEN;
        require(address(this).balance >= reembolso, "el contrato no tiene fondos");

        _transfer(msg.sender, address(this), monto);
        (bool enviado, ) = payable(msg.sender).call{value: reembolso}("");
        require(enviado, "Error al devolver Ether");
        emit Devolucion(msg.sender, cantidad);
    }

    function comprarBoletos(uint256 cantidad) public {
        require(loteriaAbierta, "loteria cerrada");
        require(cantidad > 0, "minimo 1");

        uint256 costo = cantidad * PRECIO_BOLETO;
        require(balanceOf(msg.sender) >= costo, "no tenes suficientes tokens");

        if (contratosAuxiliares[msg.sender] == address(0)) {
            _registrarUsuario(msg.sender);
        }

        _transfer(msg.sender, address(this), costo);

        ContratoUsuario aux = ContratoUsuario(contratosAuxiliares[msg.sender]);
        uint[] memory ids = new uint[](cantidad);

        for (uint256 i = 0; i < cantidad; i++) {
            uint256 id = nftContract.mintBoleto(msg.sender);
            aux.agregarBoleto(id);
            propietarioDelBoleto[id] = msg.sender;
            boletosVendidos.push(id);
            ids[i] = id;
        }

        emit BoletosComprados(msg.sender, ids);
    }

    function totalBoletosVendidos() external view returns (uint) {
        return boletosVendidos.length;
    }

    function seleccionarGanador() public onlyOwner {
        require(loteriaAbierta, "ganador ya seleccionado");
        require(boletosVendidos.length > 0, "sin boletos vendidos");

        loteriaAbierta = false;

        uint idx = uint(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            boletosVendidos.length
        ))) % boletosVendidos.length;

        boletoPremiadoId = boletosVendidos[idx];
        ganador = propietarioDelBoleto[boletoPremiadoId];

        uint256 pozo = address(this).balance;
        uint256 premio = (pozo * 90) / 100;
        uint256 comision = pozo - premio;

        (bool premioEnviado, ) = payable(ganador).call{value: premio}("");
        require(premioEnviado, "Error enviando premio");
        (bool comisionEnviada, ) = payable(owner()).call{value: comision}("");
        require(comisionEnviada, "Error enviando comision");

        emit GanadorSeleccionado(ganador, boletoPremiadoId, premio);
    }

    function reiniciarLoteria() public onlyOwner {
        require(!loteriaAbierta, "ya esta activa");
        delete boletosVendidos;
        ganador = address(0);
        boletoPremiadoId = 0;
        loteriaAbierta = true;
    }
}
