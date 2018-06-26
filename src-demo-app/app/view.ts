// tslint:disable:no-any
// tslint:disable:max-file-line-count
// tslint:disable:no-implicit-dependencies
// tslint:disable:no-import-side-effect
// tslint:disable:no-submodule-imports
import * as $ from 'jquery';
import 'jquery-ui-bundle';
import { Logger } from './logger';

export interface LoginFormData {
  artichokeServer: string;
  authServer: string;
  userEmail: string;
  userPassword: string;
}

export const makeLoginForm = (id: string, onClick: (formData: LoginFormData) => void
): JQuery => {
  const form = $('<form id="login_form">')
    .append([
      makeInput('server-artichoke', 'ArtichokeServer:', 'ArtichokeServer', 'https://artichoke.stage.closerapp.com'),
      makeInput('server-auth', 'AuthServer:', 'AuthServer', 'https://spinner.stage.closerapp.com'),
      makeSelect('user-email-select', 'Email:', ['charlie@ratel.io', 'jimmy@ratel.io', 'none']),
      makeDiv().html(
        '<a href="https://git.contactis.pl/closer/runny-sea-men/blob/master/data/agents.csv" ' +
        'target="_blank">Agents data<a/>'),
      makeInput('user-email', '', 'charlie@ratel.io', ''),
      makeInput('user-password', 'Password:', 'stokrotka2817', 'stokrotka2817')
    ]);

  const button = $('<button class="btn btn-primary" form="login_form">')
    .append('Login!')
    .click(event => {
      event.preventDefault();
      const artichokeServer = String($('#server-artichoke').val());
      const authServer = String($('#server-auth').val());
      const userEmail = String($('#user-email').val());
      const userEmailSelect = String($('#user-email-select').val());
      const userPassword = String($('#user-password').val());
      const email = userEmailSelect === 'none' ? userEmail : userEmailSelect;
      onClick({artichokeServer, authServer, userEmail: email, userPassword});
    });

  return $('<div>')
    .prop('id', id)
    .append([form, button]);
};

export const makeLabel = (id: string, className: string, name: string | JQuery): JQuery =>
  $('<label>').prop({
    for: id,
    class: className
  })
    .append(name);

export const makeSelect = (id: string, name: string, options: ReadonlyArray<string>): JQuery => {
  const select = $('<select>')
      .prop({
        id, name
      })
      .append(options.map(value => $('<option>').prop({value}).text(value)));

  return $('<div>').append([makeLabel(id, '', name), select]);
};

export const makeInput = (id: string, name: string, placeholder: string, value?: string): JQuery => {
  const input = $('<input>')
    .prop({
      id,
      type: 'text',
      class: 'form-control',
      placeholder,
      value: value || ''
    });

  return $('<div>').addClass('form-group').append([makeLabel(id, '', name), input]);
};

export const makeCheckbox = (id: string, value: string, checked: boolean,
                             onClick?: (flag: boolean) => void): JQuery => {
  const input = $('<input>')
    .prop({
      id,
      type: 'checkbox',
      checked: !!checked
    });
  input.click(() => {
    if (onClick) {
      onClick(input.is(':checked'));
    }
  });

  return $('<div>').append(input, [makeLabel(id, '', value)]);
};

export const makeCallingInput = (id: string, onCall: (userId: string) => void,
                                 placeholder?: string, value?: string): JQuery => {
  const form = $('<form id="calling_form">')
    .append([
      makeInput('calling-id', 'Calle:', placeholder || '', value || '')
    ]);

  const button = $('<button class="btn btn-primary" form="calling_form">')
    .append('Call')
    .click((ev) => {
      ev.preventDefault();
      onCall(String($('#calling-id').val()));
    });

  return $('<div>')
    .prop('id', id)
    .append([form, button]);
};

export const makeButton = (className: string, contents: JQuery | string, onClick: () => void): JQuery =>
  $('<button>').prop({
    type: 'button',
    class: `btn ${className}`
  })
    .append(contents)
    .click(onClick);

export const makeButtonGroup = (): JQuery =>
  $('<div>').addClass('btn-group buttons');

const makeAudio = (id: string, stream: MediaStream, muted: boolean): JQuery => {
  try {
    return $('<audio>')
      .prop({
        id,
        class: 'audio-stream',
        autoplay: true,
        muted,
        srcObject: stream
      });
  } catch (error) {
    return $('<audio>')
      .prop({
        id,
        class: 'audio-stream',
        autoplay: true,
        muted,
        src: URL.createObjectURL(stream)
      });
  }
};

const makeVideo = (id: string, stream: MediaStream, muted: boolean): JQuery => {
  try {
    return $('<video>')
      .prop({
        id,
        class: 'video-stream',
        autoplay: true,
        muted,
        srcObject: stream
      });
  } catch (error) {
    return $('<video>')
      .prop({
        id,
        class: 'video-stream',
        autoplay: true,
        muted,
        src: URL.createObjectURL(stream)
      });
  }
};

const makeAudioTrackStatus = (track: MediaStreamTrack): JQuery => {
  const div = makeDiv();
  div.text(`Audio track`);

  track.onended = (): void => {
    div.text(`Audio track - ENDED`);
  };

  return div;
};

const makeVideoTrackStatus = (track: MediaStreamTrack): JQuery => {
  const div = makeDiv();
  div.text(`Video track`);

  track.onended = (): void => {
    Logger.log('VIDEO end');
    div.text(`Video track - ENDED`);
  };

  return div;
};

export const makeRemoteTrack = (id: string,
                                name: string,
                              track: MediaStreamTrack): JQuery => {
  const label = makeLabel(id, '', name);
  const panel = $('<div>')
    .addClass('panel panel-default stream-wrapper');
  const stream = new MediaStream([track]);

  if (track.kind === 'video') {
    const video = makeVideo(id, stream, false);
    panel.append([label, video, makeVideoTrackStatus(track)]);
  } else {
    const audio = makeAudio(id, stream, false);
    panel.append([label, audio, makeAudioTrackStatus(track)]);
  }

  return makeDiv().append(panel);
};

export const makeSplitGridItem = (elem: JQuery): JQuery =>
  elem.addClass('grid-item');

export const makeSplitGridRow = (): JQuery =>
  $('<div>').addClass('grid-row');

export const makeSplitGrid = (): JQuery =>
  $('<div>').addClass('grid');

export const makeDiv = (): JQuery =>
  $('<div>');

export const makeCallbox = (id: string, className: string, streams: ReadonlyArray<JQuery>): JQuery =>
  $('<div>')
    .prop({
      id,
      class: className
    })
    .append([...streams]);

// tslint:disable:readonly-array
export const makeControls = (id: string, contents: JQuery | JQuery[]): JQuery =>
  $('<div>')
    .prop({
      id,
      class: 'controls'
    })
    .append(contents);

export const confirmModal = (title: string, text: string, confirmText: string, onConfirm: () => void,
                             cancelText: string, onCancel: () => void): () => void => {
  const buttons: { [key: string]: () => void } = {};
  buttons[confirmText] = (): void => {
    onConfirm();
    modal.dialog('close');
  };
  buttons[cancelText] = (): void => {
    onCancel();
    modal.dialog('close');
  };
  const modal = makeDiv()
    .prop('title', title)
    .append($('<span>').text(text))
    .dialog({
      resizable: false,
      height: 'auto',
      width: 400,
      modal: true,
      buttons
    });

  return (): void => {
    modal.dialog('close');
  };
};