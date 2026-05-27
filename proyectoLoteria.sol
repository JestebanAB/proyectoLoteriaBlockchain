// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContratoUsuario {

    address public usuario;

    constructor(address _usuario){
        usuario = _usuario;
    } 
}

contract proyectoLoteria is ERC20, Ownable {

    uint public precioToken = 1 ether;
    mapping(address => address) public contratosUsuarios;

    constructor()
        ERC20("LoteriaToken", "LOT")
        Ownable(msg.sender)
    {
        _mint(address(this), 10000);
    }

    function registrarUsuario(address usuario) internal {

        require(contratosUsuarios[usuario] == address(0),"Usuario ya registrado");

        ContratoUsuario nuevoContrato = new ContratoUsuario(usuario);

        contratosUsuarios[usuario] = address(nuevoContrato);
    }

    function comprarTokens(uint cantidadTokens) public payable {

        if(contratosUsuarios[msg.sender] == address(0)){
            registrarUsuario(msg.sender);
            }

        uint costo = cantidadTokens * precioToken;
        require(msg.value >= costo, "Ether insuficiente");

        require(balanceOf(address(this)) >= cantidadTokens, "No hay suficientes tokens");

        _transfer(address(this), msg.sender, cantidadTokens);

        uint excedente = msg.value - costo;
        
        if(excedente > 0){
            payable(msg.sender).transfer(excedente);
            }
    }

    function devolverTokens(uint cantidadTokens) public {

        require(cantidadTokens > 0, "Cantidad invalida");

        require(balanceOf(msg.sender) >= cantidadTokens,"No tienes suficientes tokens");

        _transfer(msg.sender, address(this), cantidadTokens);

        uint etherADevolver = cantidadTokens * precioToken;

        require(address(this).balance >= etherADevolver,"El contrato no tiene suficiente Ether");

        payable(msg.sender).transfer(etherADevolver);

    }

}