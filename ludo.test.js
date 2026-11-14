'use strict';

const {
    CASAS_PISTA,
    CASAS_CHEGADA,
    PROGRESSO_FINAL,
    CASAS_SEGURAS,
    POSICOES_INICIAIS,
    criarPartida,
    obterPosicaoNaPista,
    ehCasaSegura,
    obterMovimentosPossiveis,
    lancarDado,
    moverPeca,
    verificarVitoria
} = require('./ludo');

const BASE = -1;

// Cria uma partida já com o progresso das peças de cada jogador
function partidaCom(progJ0 = [BASE, BASE, BASE, BASE], progJ1 = [BASE, BASE, BASE, BASE]) {
    const partida = criarPartida();
    progJ0.forEach((p, i) => { partida.jogadores[0].pecas[i].progresso = p; });
    progJ1.forEach((p, i) => { partida.jogadores[1].pecas[i].progresso = p; });
    return partida;
}

// Lança o dado e move a peça em sequência
function jogar(partida, jogador, dado, idPeca) {
    lancarDado(partida, dado);
    return moverPeca(partida, jogador, idPeca);
}

describe('Criação da partida para dois jogadores', () => {
    test('CT01 - cria partida com dois jogadores', () => {
        const partida = criarPartida();
        expect(partida.jogadores).toHaveLength(2);
        expect(partida.jogadores.map(j => j.id)).toEqual([0, 1]);
    });

    test('CT02 - cada jogador possui quatro peças', () => {
        const partida = criarPartida();
        partida.jogadores.forEach(jogador => {
            expect(jogador.pecas).toHaveLength(4);
            expect(jogador.pecas.map(p => p.id)).toEqual([0, 1, 2, 3]);
        });
    });

    test('CT03 - armazena os nomes informados', () => {
        const partida = criarPartida(['Ana', 'Bia']);
        expect(partida.jogadores[0].nome).toBe('Ana');
        expect(partida.jogadores[1].nome).toBe('Bia');
    });

    test('CT03 - remove espaços extras dos nomes', () => {
        const partida = criarPartida(['  Ana ', ' Bia  ']);
        expect(partida.jogadores.map(j => j.nome)).toEqual(['Ana', 'Bia']);
    });

    test('CT03 - usa nomes padrão quando nada é informado', () => {
        const partida = criarPartida();
        expect(partida.jogadores.map(j => j.nome)).toEqual(['Jogador 1', 'Jogador 2']);
    });

    test.each([
        ['lista vazia', []],
        ['um jogador', ['Ana']],
        ['três jogadores', ['Ana', 'Bia', 'Caio']],
        ['string', 'Ana,Bia'],
        ['null', null]
    ])('CT04 - rejeita quantidade inválida de jogadores (%s)', (_, nomes) => {
        expect(() => criarPartida(nomes)).toThrow(TypeError);
    });

    test.each([
        ['nome vazio', ['', 'Bia']],
        ['nome só com espaços', ['   ', 'Bia']],
        ['nome numérico', [1, 'Bia']],
        ['nome null', ['Ana', null]],
        ['nome undefined', ['Ana', undefined]],
        ['nome objeto', [{}, 'Bia']]
    ])('CT05 - rejeita nomes inválidos (%s)', (_, nomes) => {
        expect(() => criarPartida(nomes)).toThrow(TypeError);
    });

    test('CT06 - todas as peças começam na base', () => {
        const partida = criarPartida();
        partida.jogadores.forEach(jogador => {
            jogador.pecas.forEach(peca => expect(peca.progresso).toBe(BASE));
        });
    });

    test('CT07 - jogador 0 começa e a partida fica ativa', () => {
        const partida = criarPartida();
        expect(partida.jogadorDaVez).toBe(0);
        expect(partida.status).toBe('jogando');
        expect(partida.vencedor).toBeNull();
        expect(partida.dado).toBeNull();
        expect(partida.movimentosPossiveis).toEqual([]);
        expect(partida.historico).toEqual([]);
    });
});

describe('Tabuleiro e casas seguras', () => {
    test('CT08 - percurso possui 52 casas', () => {
        expect(CASAS_PISTA).toBe(52);
        expect(PROGRESSO_FINAL).toBe(CASAS_PISTA + CASAS_CHEGADA);
    });

    test('CT09 - jogadores começam em posições opostas', () => {
        expect(POSICOES_INICIAIS).toEqual([0, 26]);
        expect(POSICOES_INICIAIS[1] - POSICOES_INICIAIS[0]).toBe(CASAS_PISTA / 2);
    });

    test('CT10 - posição do primeiro jogador', () => {
        expect(obterPosicaoNaPista(0, 0)).toBe(0);
        expect(obterPosicaoNaPista(0, 5)).toBe(5);
        expect(obterPosicaoNaPista(0, 51)).toBe(51);
    });

    test('CT11 - posição do segundo jogador', () => {
        expect(obterPosicaoNaPista(1, 0)).toBe(26);
        expect(obterPosicaoNaPista(1, 10)).toBe(36);
    });

    test('CT12 - posição permanece dentro dos limites ao dar a volta', () => {
        expect(obterPosicaoNaPista(1, 26)).toBe(0);
        expect(obterPosicaoNaPista(1, 30)).toBe(4);
        expect(obterPosicaoNaPista(1, 51)).toBe(25);

        for (let jogador = 0; jogador < 2; jogador++) {
            for (let progresso = 0; progresso < CASAS_PISTA; progresso++) {
                const posicao = obterPosicaoNaPista(jogador, progresso);
                expect(posicao).toBeGreaterThanOrEqual(0);
                expect(posicao).toBeLessThan(CASAS_PISTA);
            }
        }
    });

    test('CT13 - peça na chegada não ocupa o percurso comum', () => {
        for (let progresso = CASAS_PISTA; progresso <= PROGRESSO_FINAL; progresso++) {
            expect(obterPosicaoNaPista(0, progresso)).toBeNull();
            expect(obterPosicaoNaPista(1, progresso)).toBeNull();
        }
    });

    test('CT14 - identifica as casas seguras', () => {
        CASAS_SEGURAS.forEach(casa => expect(ehCasaSegura(casa)).toBe(true));
    });

    test('CT14 - casas fora da lista não são seguras', () => {
        const comuns = Array.from({ length: CASAS_PISTA }, (_, i) => i)
            .filter(i => !CASAS_SEGURAS.includes(i));
        comuns.forEach(casa => expect(ehCasaSegura(casa)).toBe(false));
    });

    test.each([
        ['jogador negativo', -1, 0],
        ['jogador inexistente', 2, 0],
        ['jogador não inteiro', 0.5, 0],
        ['jogador string', '0', 0],
        ['progresso na base', 0, -1],
        ['progresso acima do final', 0, PROGRESSO_FINAL + 1],
        ['progresso decimal', 0, 1.5],
        ['progresso string', 0, '3'],
        ['progresso NaN', 0, NaN]
    ])('CT15 - rejeita parâmetros inválidos (%s)', (_, jogador, progresso) => {
        expect(() => obterPosicaoNaPista(jogador, progresso)).toThrow(RangeError);
    });
});

describe('Lançamento do dado e entrada das peças', () => {
    test.each([1, 2, 3, 4, 5, 6])('CT16 - aceita o valor %i', valor => {
        const partida = criarPartida();
        expect(() => lancarDado(partida, valor)).not.toThrow();
        expect(partida.ultimoDado).toBe(valor);
    });

    test('CT16 - sem valor informado, sorteia um valor entre 1 e 6', () => {
        for (let i = 0; i < 50; i++) {
            const partida = criarPartida();
            lancarDado(partida);
            expect(partida.ultimoDado).toBeGreaterThanOrEqual(1);
            expect(partida.ultimoDado).toBeLessThanOrEqual(6);
        }
    });

    test.each([
        ['zero', 0],
        ['sete', 7],
        ['negativo', -1],
        ['decimal', 3.5],
        ['string', '3'],
        ['NaN', NaN],
        ['null', null]
    ])('CT17 - rejeita valor inválido do dado (%s)', (_, valor) => {
        const partida = criarPartida();
        expect(() => lancarDado(partida, valor)).toThrow(RangeError);
        expect(partida.dado).toBeNull();
        expect(partida.jogadorDaVez).toBe(0);
    });

    test('CT18 - tirar 6 permite sair da base', () => {
        const partida = criarPartida();
        const movimentos = lancarDado(partida, 6);

        expect(movimentos).toEqual([0, 1, 2, 3]);
        expect(partida.dado).toBe(6);

        moverPeca(partida, 0, 0);
        expect(partida.jogadores[0].pecas[0].progresso).toBe(0);
        expect(partida.jogadores[0].pecas[1].progresso).toBe(BASE);
    });

    test.each([1, 2, 3, 4, 5])('CT19 - tirar %i com todas na base não move nada e passa a vez', valor => {
        const partida = criarPartida();
        const movimentos = lancarDado(partida, valor);

        expect(movimentos).toEqual([]);
        expect(partida.jogadorDaVez).toBe(1);
        expect(partida.dado).toBeNull();
        partida.jogadores[0].pecas.forEach(p => expect(p.progresso).toBe(BASE));
    });

    test('CT20 - sem peça movimentável a vez passa para o adversário', () => {
        // três finalizadas e uma a 3 casas do fim, dado 5 não cabe
        const partida = partidaCom([58, 58, 58, 55]);
        const movimentos = lancarDado(partida, 5);

        expect(movimentos).toEqual([]);
        expect(partida.jogadorDaVez).toBe(1);
        expect(partida.dado).toBeNull();
        expect(partida.movimentosPossiveis).toEqual([]);
    });

    test('CT21 - rejeita novo lançamento antes de mover', () => {
        const partida = criarPartida();
        lancarDado(partida, 6);

        expect(() => lancarDado(partida, 3)).toThrow('Escolha uma peça antes de lançar o dado novamente');
        expect(partida.dado).toBe(6);
    });
});

describe('Movimentação das peças', () => {
    test('CT22 - peça avança a quantidade correta de casas', () => {
        const partida = partidaCom([10, BASE, BASE, BASE]);
        jogar(partida, 0, 4, 0);

        expect(partida.jogadores[0].pecas[0].progresso).toBe(14);
        expect(partida.dado).toBeNull();
        expect(partida.movimentosPossiveis).toEqual([]);
    });

    test('CT23 - movimento sem tirar 6 passa a vez', () => {
        const partida = partidaCom([10, BASE, BASE, BASE]);
        jogar(partida, 0, 4, 0);

        expect(partida.jogadorDaVez).toBe(1);
    });

    test('CT24 - movimento após tirar 6 mantém o mesmo jogador', () => {
        const partida = partidaCom([10, BASE, BASE, BASE]);
        jogar(partida, 0, 6, 0);

        expect(partida.jogadores[0].pecas[0].progresso).toBe(16);
        expect(partida.jogadorDaVez).toBe(0);
    });

    test('CT25 - rejeita jogar fora da vez', () => {
        const partida = partidaCom([10, BASE, BASE, BASE], [10, BASE, BASE, BASE]);
        lancarDado(partida, 3);

        expect(() => moverPeca(partida, 1, 0)).toThrow('Não é a vez deste jogador');
        expect(partida.jogadores[1].pecas[0].progresso).toBe(10);
    });

    test('CT26 - rejeita mover antes de lançar o dado', () => {
        const partida = partidaCom([10, BASE, BASE, BASE]);

        expect(() => moverPeca(partida, 0, 0)).toThrow('É necessário lançar o dado antes de mover uma peça');
        expect(partida.jogadores[0].pecas[0].progresso).toBe(10);
    });

    test.each([[4], [-1], [1.5], ['0'], [undefined]])('CT27 - rejeita peça inexistente (%p)', idPeca => {
        const partida = partidaCom([10, BASE, BASE, BASE]);
        lancarDado(partida, 3);

        expect(() => moverPeca(partida, 0, idPeca)).toThrow(RangeError);
    });

    test('CT28 - rejeita peça indisponível para o valor do dado', () => {
        // peça 1 está na base e o dado não é 6
        const partida = partidaCom([10, BASE, BASE, BASE]);
        lancarDado(partida, 3);

        expect(() => moverPeca(partida, 0, 1))
            .toThrow('A peça não pode ser movimentada com este resultado do dado');
        expect(partida.jogadores[0].pecas[1].progresso).toBe(BASE);
    });

    test('CT29 - não permite ultrapassar a chegada', () => {
        const partida = partidaCom([56, BASE, BASE, BASE]);

        expect(obterMovimentosPossiveis(partida, 0, 3)).toEqual([]);

        lancarDado(partida, 3);
        expect(partida.jogadorDaVez).toBe(1);
        expect(partida.jogadores[0].pecas[0].progresso).toBe(56);
    });

    test('CT29 - moverPeca rejeita peça que ultrapassaria a chegada', () => {
        const partida = partidaCom([56, 10, BASE, BASE]);
        lancarDado(partida, 3);

        expect(partida.movimentosPossiveis).toEqual([1]);
        expect(() => moverPeca(partida, 0, 0)).toThrow('A peça não pode ser movimentada');
    });

    test('CT30 - peça só finaliza com o valor exato', () => {
        const partida = partidaCom([56, BASE, BASE, BASE]);

        expect(obterMovimentosPossiveis(partida, 0, 1)).toEqual([0]);
        expect(obterMovimentosPossiveis(partida, 0, 2)).toEqual([0]);
        expect(obterMovimentosPossiveis(partida, 0, 3)).toEqual([]);
        expect(obterMovimentosPossiveis(partida, 0, 4)).toEqual([]);
        expect(obterMovimentosPossiveis(partida, 0, 5)).toEqual([]);
    });

    test('CT31 - alcançar exatamente a chegada marca a peça como finalizada', () => {
        const partida = partidaCom([56, BASE, BASE, BASE]);
        jogar(partida, 0, 2, 0);

        expect(partida.jogadores[0].pecas[0].progresso).toBe(PROGRESSO_FINAL);
        expect(partida.status).toBe('jogando');
    });

    test('CT32 - peça finalizada não aparece entre os movimentos possíveis', () => {
        const partida = partidaCom([PROGRESSO_FINAL, 10, BASE, BASE]);

        for (let dado = 1; dado <= 6; dado++) {
            expect(obterMovimentosPossiveis(partida, 0, dado)).not.toContain(0);
        }
    });
});

describe('Capturas e proteção das casas seguras', () => {
    // jogador 0: progresso 4 -> posição 4, com dado 1 vai para a posição 5 (não segura)
    // jogador 1: progresso 31 -> posição (26 + 31) % 52 = 5
    test('CT33 - captura peça adversária em casa desprotegida', () => {
        const partida = partidaCom([4, BASE, BASE, BASE], [BASE, BASE, 31, BASE]);
        jogar(partida, 0, 1, 0);

        expect(partida.jogadores[0].pecas[0].progresso).toBe(5);
        expect(partida.jogadores[1].pecas[2].progresso).toBe(BASE);
    });

    test('CT33 - captura todas as peças adversárias na mesma casa', () => {
        const partida = partidaCom([4, BASE, BASE, BASE], [31, 31, BASE, BASE]);
        jogar(partida, 0, 1, 0);

        expect(partida.jogadores[1].pecas[0].progresso).toBe(BASE);
        expect(partida.jogadores[1].pecas[1].progresso).toBe(BASE);
    });

    test('CT33 - não captura peça adversária em outra casa', () => {
        const partida = partidaCom([4, BASE, BASE, BASE], [BASE, BASE, 32, BASE]);
        jogar(partida, 0, 1, 0);

        expect(partida.jogadores[1].pecas[2].progresso).toBe(32);
    });

    test('CT34 - captura aparece no histórico', () => {
        const partida = partidaCom([4, BASE, BASE, BASE], [BASE, BASE, 31, BASE]);
        jogar(partida, 0, 1, 0);

        expect(partida.historico).toHaveLength(1);
        expect(partida.historico[0]).toEqual({
            jogador: 0,
            peca: 0,
            dado: 1,
            progressoAnterior: 4,
            progressoNovo: 5,
            capturadas: [2]
        });
    });

    test('CT34 - movimento sem captura registra lista vazia', () => {
        const partida = partidaCom([4, BASE, BASE, BASE]);
        jogar(partida, 0, 1, 0);

        expect(partida.historico[0].capturadas).toEqual([]);
    });

    // jogador 0: progresso 7 + dado 1 -> posição 8 (segura)
    // jogador 1: progresso 34 -> posição (26 + 34) % 52 = 8
    test('CT35 - pousar em casa segura não captura', () => {
        const partida = partidaCom([7, BASE, BASE, BASE], [BASE, 34, BASE, BASE]);
        jogar(partida, 0, 1, 0);

        expect(partida.jogadores[0].pecas[0].progresso).toBe(8);
        expect(partida.jogadores[1].pecas[1].progresso).toBe(34);
        expect(partida.historico[0].capturadas).toEqual([]);
    });

    test('CT36 - peça na chegada não é capturada', () => {
        const partida = partidaCom([4, BASE, BASE, BASE], [BASE, 53, BASE, BASE]);
        jogar(partida, 0, 1, 0);

        expect(partida.jogadores[1].pecas[1].progresso).toBe(53);
        expect(partida.historico[0].capturadas).toEqual([]);
    });

    test('CT36 - peça entrando na chegada não captura ninguém', () => {
        const partida = partidaCom([50, BASE, BASE, BASE], [BASE, 27, BASE, BASE]);
        jogar(partida, 0, 3, 0);

        expect(partida.jogadores[0].pecas[0].progresso).toBe(53);
        expect(partida.jogadores[1].pecas[1].progresso).toBe(27);
    });
});

describe('Vitória e encerramento', () => {
    test('CT37 - identifica vitória com as quatro peças na chegada', () => {
        const partida = partidaCom([58, 58, 58, 58]);
        expect(verificarVitoria(partida, 0)).toBe(true);
        expect(verificarVitoria(partida, 1)).toBe(false);
    });

    test('CT37 - não há vitória com peça faltando', () => {
        expect(verificarVitoria(partidaCom([58, 58, 58, 57]), 0)).toBe(false);
        expect(verificarVitoria(partidaCom([58, 58, 58, BASE]), 0)).toBe(false);
        expect(verificarVitoria(criarPartida(), 0)).toBe(false);
    });

    test('CT37 - rejeita jogador ou partida inválidos', () => {
        expect(() => verificarVitoria(criarPartida(), 2)).toThrow(RangeError);
        expect(() => verificarVitoria(null, 0)).toThrow(TypeError);
        expect(() => verificarVitoria({}, 0)).toThrow(TypeError);
    });

    test('CT38 - finalizar a última peça encerra a partida e registra o vencedor', () => {
        const partida = partidaCom([58, 58, 58, 56]);
        jogar(partida, 0, 2, 3);

        expect(partida.status).toBe('encerrada');
        expect(partida.vencedor).toBe(0);
        expect(partida.dado).toBeNull();
        expect(partida.movimentosPossiveis).toEqual([]);
    });

    test('CT38 - vitória do segundo jogador', () => {
        const partida = partidaCom([BASE, BASE, BASE, BASE], [58, 58, 58, 57]);
        partida.jogadorDaVez = 1;
        jogar(partida, 1, 1, 3);

        expect(partida.status).toBe('encerrada');
        expect(partida.vencedor).toBe(1);
    });

    test('CT38 - finalizar uma peça que não é a última não encerra', () => {
        const partida = partidaCom([58, 58, 56, BASE]);
        jogar(partida, 0, 2, 2);

        expect(partida.status).toBe('jogando');
        expect(partida.vencedor).toBeNull();
    });

    test('CT39 - rejeita lançar dado após o encerramento', () => {
        const partida = partidaCom([58, 58, 58, 56]);
        jogar(partida, 0, 2, 3);

        expect(() => lancarDado(partida, 3)).toThrow('A partida não está em andamento');
    });

    test('CT40 - rejeita mover peça após o encerramento', () => {
        const partida = partidaCom([58, 58, 58, 56]);
        jogar(partida, 0, 2, 3);

        expect(() => moverPeca(partida, 0, 0)).toThrow('A partida não está em andamento');
    });
});