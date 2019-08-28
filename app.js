/**
 * Atividade de Banco de Dados NOSQL - UFRN
 * Author: Valmir Correa da Silva Junior
 * E-mail: valmircsjr@gmail.com
 * Comandos: 
 *  - Instalar dependencias:
 *      - npm install
 *  - Subir o conteiner do Redis no docker: 
 *      - sudo docker run -d -p 6379:6379 -d redis
 *  - Iniciar aplicação:
 *      - npm start
 *  - Para acessar o cliente do redis no docker:
 *      - sudo docker exec -it <containerCode> redis-cli
 */

/* Constantes importantes */
const express = require('express')  /* Módulo do express */
const app = express()               /* Utilizando o framework na aplicação */
const port = 3000                   /* Porta local em que a aplicação vai rodar */
const redis = require("redis")      /* Módulo do Redis */
const cache = redis.createClient()  /* Driver para o banco */
const cacheName = "scorezset"       /* Nome do zset no cache */
const PATH_SUMARY = '</br> </br>' + /* Info sobre os paths da aplicação */
' Paths: </br>' + 
' <li> Pagina Inicial:                      <i><b> /                        </b></i> </li>' +
' <li> Adicionar N pontos ao jogador X:     <i><b> /add/:score/:player      </b></i> </li>' +
' <li> Remover N Pontos ao jogador X:       <i><b> /remove/:score/:player   </b></i> </li>' +
' <li> Listar os TOP 10:                    <i><b> /listTop10               </b></i> </li>' +
' <li> Jogador na Enésima posição no rank : <i><b> /position/:pos           </b></i>'

/* Lança um erro se nao houver conexão como o banco */
cache.on("error", function (err) {
    console.log('Redis error', err );
});

/* Msg de sucesso na conexão como o Redis */
cache.on("connect", function (error) {
    console.log('Redis is ready');
});

/* Tela inicial da aplicação web */
app.get('/', (req, res) => res.send('Welcome to score points game!' + PATH_SUMARY))

/* Adicionar N pontos ao jogador X */
app.get('/add/:score/:player', (req, res) => {
    const n = req.params.score
    const x = req.params.player
    addScoreToCache(n, x, res)
})

/* Remover N Pontos ao jogador X */
app.get('/remove/:score/:player', (req, res) => {
    const n = req.params.score
    const x = req.params.player
    removeScoreToCache(n, x, res)
})

/* Listar os TOP 10 */
app.get('/listTop10', (req, res) => {
    cache.ZREVRANGE(cacheName, 0, 9, 'withscores', function(err, members) {
        if (err) {
            res.send(`Error to list top 10, sorry!` + PATH_SUMARY)
        } else {
            res.json(members)
        }
    })
})

/* Jogador na Enésima posição no rank */
app.get('/position/:pos', (req, res) => {
    const pos = check(req.params.pos, res)
    cache.ZREVRANGE(cacheName, pos, pos, function(err, player) {
        if (err) {
            res.send(`Error to list player, sorry!` + PATH_SUMARY)
        } else if (player.length === 0){
            res.send(`This position does not exist!` + PATH_SUMARY)
        } else {
            res.send(`The player of the position ${pos} is ${player}` + PATH_SUMARY)
        }
    })
})

/**
 * Checagem para garantir um valor válido >= 0.
 * Se o usuário passar pos = 1, tenho que fazer o range de 
 * cache.ZREVRANGE(scorezset, 0, 0)... E assim para para todos os casos pos - 1.
 * @param {*} pos 
 */
function check(pos) {
    if (pos <= 0) {
        res.send(`This position does not exist!` + PATH_SUMARY)
    }
    return pos - 1
}

/**
 * Adiciona os pontos para o jogador no banco.
 * Se o jogador não for encontrado, ele será adicionado. 
 * Se for, apenas acressenta o score.
 */
function addScoreToCache(score, player, res) {
    cache.ZINCRBY(cacheName, score, player, (err, reply) => {
        if (err) {
            cache.ZADD(cacheName, score, player)
            res.send(`Success add the score ${score} to player ${player}` + PATH_SUMARY)
        } else {
            res.send(`Success increased the score ${score} to player ${player}` + PATH_SUMARY)
        }
    })
}

/* Remove os pontos para o jogador no banco */
function removeScoreToCache(score, player, res) {
    cache.ZINCRBY(cacheName, -score, player, (err, reply) => {
        if (err) {
            res.send(`Playear ${player} does not exist!` + PATH_SUMARY)
        } else {
            res.send(`Success decreased the score ${score} to player ${player}` + PATH_SUMARY)
        }
    })
}

/* Mensagem para o Start up da aplicação na porta especificada */
app.listen(port, () => console.log(`App listening on port ${port}!`))
