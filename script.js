// Função para carregar o arquivo XLSX da pasta raiz e preencher os campos
window.onload = function() {
    carregarMateriais();
};


function removerAcentos(str) {
    const map = {
        'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n',
        // Letras maiúsculas com acento
        'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
        'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
        'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
        'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
        'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U'
    };
    return str.replace(/[áàãâäéèêëíìîïóòõÓôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜ]/g, match => map[match] || match);
}


// Variável global para armazenar os materiais carregados
let materiaisDisponiveis = [];

// Função para carregar o arquivo XLSX e preencher o menu de classificações
function carregarMateriais() {
    fetch('Banco de dados.xlsx')
        .then(response => response.arrayBuffer()) // Lê o arquivo binário
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });

            // A primeira planilha do arquivo
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Converte os dados da planilha para um formato JSON
            materiaisDisponiveis = XLSX.utils.sheet_to_json(sheet);

            // Verificando se o arquivo foi lido corretamente
            console.log('Conteúdo lido do XLSX:', materiaisDisponiveis);

            // Preencher o menu de classificações ordenadas alfabeticamente
            preencherClassificacoes();
        })
        .catch(error => console.error("Erro ao carregar o arquivo XLSX:", error));
}

// Função para preencher o menu suspenso de classificações em ordem alfabética
function preencherClassificacoes() {
    const selectClassificacao = document.getElementById('classificacao');

    // Obtém todas as classificações únicas e ordena alfabeticamente
    const classificacoesUnicas = [...new Set(materiaisDisponiveis.map(material => material['classificação']))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Adiciona opções ao select
    selectClassificacao.innerHTML = '<option value="">Selecione...</option>'; // Garante que a primeira opção seja "Selecione..."
    
    classificacoesUnicas.forEach(classificacao => {
        const option = document.createElement('option');
        option.value = classificacao;
        option.textContent = classificacao;
        selectClassificacao.appendChild(option);
    });
}

// Função para atualizar a lista de materiais com base na classificação selecionada
function atualizarMateriais() {
    const classificacaoSelecionada = document.getElementById('classificacao').value;
    const selectMateriais = document.getElementById('materiais');

    // Limpa as opções anteriores
    selectMateriais.innerHTML = '';

    if (!classificacaoSelecionada) return;

    // Filtra os materiais da categoria escolhida e ordena alfabeticamente
    const materiaisCategoria = materiaisDisponiveis
        .filter(material => material['classificação'] === classificacaoSelecionada)
        .sort((a, b) => a['Simplificação'].localeCompare(b['Simplificação'], 'pt-BR'));

    // Adiciona as opções filtradas ao menu de materiais
    materiaisCategoria.forEach(material => {
        const option = document.createElement('option');
        let descricao = material['Simplificação'];

        // Adiciona tamanho/número se houver
        if (material['Tam/n°'] && material['Tam/n°'] !== 'Único') {
            descricao;
        }

        option.value = descricao;
        option.textContent = descricao;
        selectMateriais.appendChild(option);
    });
}


// Função para adicionar material à lista de itens selecionados
function adicionarMaterial() {
    const quantidade = document.getElementById('quantidade').value;
    const descricao = document.getElementById('materiais').value;
    const classificacao = document.getElementById('classificacao').value;

    // Encontrar o código correspondente ao material selecionado
    const materialSelecionado = materiaisDisponiveis.find(material => 
        material['classificação'] === classificacao && 
        material['Simplificação'] === descricao.split(' - ')[0]
    );

    if (quantidade && descricao && materialSelecionado) {
        const listaItens = document.getElementById('lista-itens');
        const li = document.createElement('li');

        // Adiciona o código do material como atributo para ser recuperado no e-mail
        li.setAttribute('data-codigo', materialSelecionado['Código']);

        // Criar o texto do item (agora inclui o código)
        li.textContent = `${materialSelecionado['Código']} - ${descricao} - Quantidade: ${quantidade}`;

        // Criar o botão de "Remover"
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'X';
        btnRemover.classList.add('remove-button');

        // Adicionando o evento de clique ao botão de "Remover"
        btnRemover.onclick = function() {
            listaItens.removeChild(li);
        };

        // Adiciona o botão "Remover" ao item
        li.appendChild(btnRemover);
        listaItens.appendChild(li);

        // Resetar os campos após adicionar
        document.getElementById('quantidade').value = '';
        document.getElementById('materiais').value = '';
    } else {
        alert('Por favor, preencha todos os campos antes de adicionar!');
    }
}

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', carregarMateriais);

// Função para enviar itens selecionados por e-mail
function enviarPorEmail() {
    const listaItens = document.getElementById('lista-itens');
    let itens = '';

    // Pega os itens da lista
    const listaItensArray = listaItens.getElementsByTagName('li');
    for (let i = 0; i < listaItensArray.length; i++) {
        const codigo = listaItensArray[i].getAttribute('data-codigo'); // Obtém o código salvo
        const descricao = listaItensArray[i].textContent.replace('X', '').trim(); // Remove o botão de remoção
        itens += `${codigo} - ${descricao}\n`;
    }

    // Pegando os valores corretos dos inputs
    const nome = document.getElementById('nome').value;
    const cidade = document.getElementById('cidade').value;
    const cpf00 = document.getElementById('cpf').value;

    // Constrói o link de e-mail
    const email = "leonardojuvencio@brkambiental.com.br";
    const assunto = `Reserva - ${nome} - ${cpf00} - ${cidade}`;
    const corpo = encodeURIComponent(`Itens Selecionados:\n\n${itens}`);

    // Cria o link mailto
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${corpo}`;

    // Abre o cliente de e-mail do usuário
    window.location.href = mailtoLink;
}



document.getElementById('matricula').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja número
});

document.getElementById('matricula').addEventListener('blur', function () {
    if (!/^\d+$/.test(this.value)) {
        this.classList.add('erro');
        document.getElementById('erro-matricula').style.display = 'block';
    } else {
        this.classList.remove('erro');
        document.getElementById('erro-matricula').style.display = 'none';
    }
});

document.getElementById('cpf').addEventListener('input', function () {
    let cpf = this.value.replace(/\D/g, ''); // Remove tudo que não for número

    // Formatação automática do CPF (999.999.999-99)
    if (cpf.length <= 3) {
        this.value = cpf;
    } else if (cpf.length <= 6) {
        this.value = cpf.slice(0, 3) + '.' + cpf.slice(3);
    } else if (cpf.length <= 9) {
        this.value = cpf.slice(0, 3) + '.' + cpf.slice(3, 6) + '.' + cpf.slice(6);
    } else {
        this.value = cpf.slice(0, 3) + '.' + cpf.slice(3, 6) + '.' + cpf.slice(6, 9) + '-' + cpf.slice(9, 11);
    }
});

document.getElementById('cpf').addEventListener('blur', function () {
    if (!validarCPF(this.value)) {
        this.classList.add('erro');
        document.getElementById('erro-cpf').style.display = 'block';
    } else {
        this.classList.remove('erro');
        document.getElementById('erro-cpf').style.display = 'none';
    }
});

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove pontos e traços

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // Impede CPFs inválidos como "111.111.111-11"

    let soma = 0, resto;

    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[10])) return false;

    return true;
}