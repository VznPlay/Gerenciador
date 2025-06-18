// Inicializa o jsPDF
const { jsPDF } = window.jspdf;

const listaClientes = document.getElementById("listaClientes");
let hasUnsavedChanges = false;

document.addEventListener("DOMContentLoaded", function() {
    carregarClientes();
    
    // Verifica se há alterações não salvas ao carregar a página
    hasUnsavedChanges = localStorage.getItem('hasUnsavedChanges') === 'true';
    updateExportButtonNotification();
});

function adicionarCliente() {
    const nome = document.getElementById("nome").value;
    const dataVencimento = document.getElementById("dataVencimento").value || new Date().toISOString().split('T')[0];
    const servidor = document.getElementById("servidor").value;

    if (nome) {
        const cliente = { nome, dataVencimento, servidor };
        salvarCliente(cliente);
        exibirCliente(cliente);
        ordenarClientes();
        mostrarNotificacao(`Cliente ${nome} Adicionado!`, 'green');

        document.getElementById("nome").value = "";
        document.getElementById("dataVencimento").value = "";
        document.getElementById("servidor").value = "";
        
        // Marca que há alterações não salvas
        hasUnsavedChanges = true;
        localStorage.setItem('hasUnsavedChanges', 'true');
        updateExportButtonNotification();
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
    mostrarNotificacao(`Cliente ${nome} Removido!`, 'red');
    
    hasUnsavedChanges = true;
    localStorage.setItem('hasUnsavedChanges', 'true');
    updateExportButtonNotification();
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
    verificarVencimentos();
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

setInterval(verificarVencimentos, 300000);

function verificarVencimentos() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const hoje = new Date();
    const proximoDia = new Date(hoje);
    proximoDia.setDate(hoje.getDate() + 1);

    clientes.forEach(cliente => {
        const dataVenc = new Date(cliente.dataVencimento);
        if (dataVenc.toDateString() === proximoDia.toDateString()) {
            mostrarNotificacao(`${cliente.nome} vence amanhã!`, 'orange');
        }
    });
}

function mostrarNotificacao(mensagem, cor) {
    const notificacaoVisual = document.getElementById("notificacaoVisual");
    const notificacaoMensagem = document.getElementById("notificacaoMensagem");

    notificacaoMensagem.textContent = mensagem;
    notificacaoVisual.style.backgroundColor = cor;
    notificacaoVisual.style.display = "block";

    setTimeout(() => {
        notificacaoVisual.style.display = "none";
    }, 8000);
}

// Funções para exportação/importação
function showExportModal() {
    document.getElementById('exportModal').style.display = 'flex';
}

function hideExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function updateExportButtonNotification() {
    const notification = document.getElementById('exportNotification');
    if (hasUnsavedChanges) {
        notification.style.display = 'flex';
        document.getElementById('exportButton').style.backgroundColor = '#4CAF50';
    } else {
        notification.style.display = 'none';
        document.getElementById('exportButton').style.backgroundColor = '#4CAF50';
    }
}

function exportarParaPDF() {
    const doc = new jsPDF();
    const exportName = document.getElementById('exportName').value || 'VznPlay';
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    
    doc.text(`Lista de Clientes - ${exportName}`, 14, 15);
    
    const headers = [["Status", "Nome", "Vencimento", "Apps"]];
    const data = clientes.map(cliente => {
        const hoje = new Date();
        const dataVenc = new Date(cliente.dataVencimento);
        const diferencaDias = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
        
        let status;
        if (diferencaDias < 0) status = "Vencido";
        else if (diferencaDias <= 7) status = "Próximo";
        else status = "OK";
        
        return [status, cliente.nome, cliente.dataVencimento.split("-").reverse().join("/"), cliente.servidor || "N/A"];
    });
    
    doc.autoTable({
        head: headers,
        body: data,
        startY: 20,
        styles: {
            halign: 'center',
            cellPadding: 2,
            fontSize: 8
        },
        headStyles: {
            fillColor: [255, 145, 0],
            textColor: 0
        }
    });
    
    const date = new Date();
    const footerText = `Relatório PDF gerado pelo Gerenciador de vencimento – VznPlay © ${date.getFullYear()} | Todos os direitos reservados.`;
    doc.setFontSize(8);
    doc.text(footerText, 14, doc.internal.pageSize.height - 10);
    
    doc.save(`clientes_${exportName}.pdf`);
    
    hasUnsavedChanges = false;
    localStorage.setItem('hasUnsavedChanges', 'false');
    updateExportButtonNotification();
    hideExportModal();
}

function exportarParaExcel() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(clientes);
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, 'clientes_vznplay.xlsx');
    
    hasUnsavedChanges = false;
    localStorage.setItem('hasUnsavedChanges', 'false');
    updateExportButtonNotification();
    hideExportModal();
}

function exportarAmbos() {
    exportarParaPDF();
    setTimeout(exportarParaExcel, 500);
}

function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        importarDeExcel(data);
    };
    reader.readAsArrayBuffer(file);
}

function importarDeExcel(data) {
    try {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
            if (confirm(`Deseja importar ${jsonData.length} clientes? Isso substituirá seus dados atuais.`)) {
                localStorage.setItem("clientes", JSON.stringify(jsonData));
                listaClientes.innerHTML = '';
                carregarClientes();
                mostrarNotificacao(`${jsonData.length} clientes importados com sucesso!`, 'green');
                
                hasUnsavedChanges = true;
                localStorage.setItem('hasUnsavedChanges', 'true');
                updateExportButtonNotification();
            }
        } else {
            alert("O arquivo Excel está vazio.");
        }
    } catch (error) {
        console.error("Erro ao importar dados:", error);
        alert("Ocorreu um erro ao importar os dados. Verifique o arquivo e tente novamente.");
    }
}