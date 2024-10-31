const listaClientes = document.getElementById("listaClientes");

document.addEventListener("DOMContentLoaded", carregarClientes);

function adicionarCliente() {
    const nome = document.getElementById("nome").value;
    const dataVencimento = document.getElementById("dataVencimento").value || new Date().toISOString().split('T')[0];
    const servidor = document.getElementById("servidor").value;

    if (nome) {
        const cliente = { nome, dataVencimento, servidor };
        salvarCliente(cliente);
        exibirCliente(cliente);
        ordenarClientes();
        mostrarNotificacao(`Cliente ${nome} Adicionado!`, 'green'); // Notificação de adição

        document.getElementById("nome").value = "";
        document.getElementById("dataVencimento").value = "";
        document.getElementById("servidor").value = "";
    } else {
        alert("Por favor, preencha o nome do cliente.");
    }
}

function salvarCliente(cliente) {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    clientes.push(cliente);
    localStorage.setItem("clientes", JSON.stringify(clientes));
}

function exibirCliente(cliente) {
    const linha = document.createElement("div");
    linha.classList.add("linha");

    const hoje = new Date();
    const dataVenc = new Date(cliente.dataVencimento);
    const diferencaDias = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));

    const status = document.createElement("div");
    status.classList.add("status");
    if (diferencaDias < 0) {
        status.style.backgroundColor = "red";
    } else if (diferencaDias <= 7) {
        status.style.backgroundColor = "orange";
    } else {
        status.style.backgroundColor = "green";
    }

    const dataFormatada = cliente.dataVencimento.split("-").reverse().join("/");

    linha.innerHTML = `
        <div>${status.outerHTML}${cliente.nome}</div>
        <div>${dataFormatada}</div>
        <div>${cliente.servidor || "N/A"}</div>
        <div class="acao">
            <span class="deletar" onclick="deletarCliente(this, '${cliente.nome}', '${cliente.dataVencimento}')">🗑️</span>
        </div>
    `;

    listaClientes.appendChild(linha);
}

function deletarCliente(element, nome, dataVencimento) {
    element.parentElement.parentElement.remove();
    removerCliente(nome, dataVencimento);
    ordenarClientes();
    mostrarNotificacao(`Cliente ${nome} Removido!`, 'red'); // Notificação de remoção
}

function removerCliente(nome, dataVencimento) {
    let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    clientes = clientes.filter(cliente => !(cliente.nome === nome && cliente.dataVencimento === dataVencimento));
    localStorage.setItem("clientes", JSON.stringify(clientes));
}

function carregarClientes() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    clientes.forEach(exibirCliente);
    ordenarClientes();
    verificarVencimentos(); // Verifica vencimentos ao carregar os clientes
}

function ordenarClientes() {
    const clientes = Array.from(listaClientes.children);
    clientes.sort((a, b) => {
        const dataA = new Date(a.children[1].textContent.split("/").reverse().join("-"));
        const dataB = new Date(b.children[1].textContent.split("/").reverse().join("-"));
        return dataA - dataB;
    });
    listaClientes.innerHTML = '';
    clientes.forEach(cliente => listaClientes.appendChild(cliente));
}

function pesquisarCliente() {
    const input = document.getElementById("pesquisa").value.toLowerCase();
    const clientes = listaClientes.getElementsByClassName("linha");
    for (const cliente of clientes) {
        const nome = cliente.children[0].textContent.toLowerCase();
        cliente.style.display = nome.includes(input) ? "flex" : "none";
    }
}

// Chame essa função a cada 1 hora (3600000 ms)
setInterval(verificarVencimentos, 300000); // Você pode ajustar o intervalo conforme necessário

function verificarVencimentos() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const hoje = new Date();
    const proximoDia = new Date(hoje);
    proximoDia.setDate(hoje.getDate() + 1); // Dia de amanhã

    clientes.forEach(cliente => {
        const dataVenc = new Date(cliente.dataVencimento);
        if (dataVenc.toDateString() === proximoDia.toDateString()) {
            mostrarNotificacao(`${cliente.nome} vence amanhã!`, 'orange'); // Notificação para vencimentos
        }
    });
}

function mostrarNotificacao(mensagem, cor) {
    const notificacaoVisual = document.getElementById("notificacaoVisual");
    const notificacaoMensagem = document.getElementById("notificacaoMensagem");

    notificacaoMensagem.textContent = mensagem;
    notificacaoVisual.style.backgroundColor = cor; // Define a cor da notificação
    notificacaoVisual.style.display = "block";

    // Esconde a notificação após 8 segundos
    setTimeout(() => {
        notificacaoVisual.style.display = "none";
    }, 8000);
}
