// @TODO: cleanup e ativar? não ta sendo usado.
import { getAllStorageSyncData, getTranslationText } from '../../utils';
// @TODO: cleanup e ativar? não ta sendo usado.
import axios from 'axios';
import { GC_URL, isFirefox } from '../../lib/constants';
import { getLobbiesLimit } from '../../lib/dom';
import { alertaMsg } from '../../lib/messageAlerts';

let intervalCriarLobby = null;

export async function adicionarBotaoForcarCriarLobby() {
  const { traducao } = await getAllStorageSyncData();
  const text = getTranslationText( 'criar-lobby-pre-configurada', traducao );

  if ( !$( '#criar-lobby-btn' ).length ) {
    setTimeout( () => {
      $( '#lobby-actions-create-lobby-button' ).parent().prepend(
        $( '<button/>', {
          'id': 'criar-lobby-btn',
          'class': 'WasdButton WasdButton--primary WasdButton--lg WasdButton--block draw-orange',
          'type': 'button',
          'text': text
        } )
      );
      $( '#criar-lobby-btn' ).addClass( 'btn-visible' );

      addListeners();
    }, 3000 );
  } else {
    $( '#criar-lobby-btn' )
      .css( { 'background-color': 'transparent', 'border-radius': '4px' } )
      .text( text )
      .removeClass( 'Cancelar' );
  }
}

function adicionarBotaoCancelarCriarLobby() {
  $( '#criar-lobby-btn' )
    .css( { 'background-color': 'red', 'border-radius': '4px' } )
    .text( 'Cancelar Criação...' )
    .addClass( 'Cancelar' );
}

function addListeners() {
  $( '#criar-lobby-btn' ).on( 'click', function () {
    if ( $( '#criar-lobby-btn' ).hasClass( 'Cancelar' ) ) {
      clearInterval( intervalCriarLobby );
      adicionarBotaoForcarCriarLobby();
    } else {
      intervalCriarLobby = intervalerCriacaoLobby();
      adicionarBotaoCancelarCriarLobby();
    }
  } );
}

//Criar lobby: https://github.com/LouisRiverstone/gamersclub-lobby_waiter/ com as modificações por causa do layout novo
function intervalerCriacaoLobby() {
  return setInterval( async () => {
    if ( !$( '.sidebar-titulo.sidebar-sala-titulo' ).text().length ) {
      const lobbies = $( '.LobbyHeader__buttons div[type="default"]' )[0].innerText.match( /\d+/ )[0];

      if ( Number( lobbies ) < getLobbiesLimit() ) {
        //Criar lobby por meio de requisição com AXIOS. ozKcs
        chrome.storage.sync.get( [ 'preVetos', 'lobbyPrivada', 'jogarCom' ], async res => {
          const preVetos = res.preVetos ? res.preVetos : [];
          const lobbyPrivada = res.lobbyPrivada ? res.lobbyPrivada : false;
          const jogarCom = res.jogarCom ? res.jogarCom : 0;
          const postData = {
            max_level_to_join: 21,
            min_level_to_join: 0,
            private: lobbyPrivada,
            region: 0,
            restriction: jogarCom,
            team: null,
            team_players: [],
            type: 'newRoom',
            vetoes: preVetos
          };

          const criarPost = await axios.post( `https://${ GC_URL }/lobbyBeta/createLobby`, postData );
          if ( criarPost.data.success ) {
            if ( isFirefox ) { window.wrappedJSObject.openLobby(); }
            setTimeout( async () => {
              adicionarBotaoForcarCriarLobby();
              clearInterval( intervalCriarLobby );
              location.reload();
            }, 1000 );
          } else {
            if ( criarPost.data.message.includes( 'Anti-cheat' ) || criarPost.data.message.includes( 'banned' ) ) {
              clearInterval( intervalCriarLobby );
              adicionarBotaoForcarCriarLobby();
              alertaMsg( criarPost.data.message );
              return;
            }
          }
        } );
      }
    } else {
      adicionarBotaoForcarCriarLobby();
      clearInterval( intervalCriarLobby );
    }
  }, 500 );
}

