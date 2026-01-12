const jp = {
    // Dashboard
    "dashboard_title": "Tempvoice ダッシュボード",
    "dashboard_description": "ようこそ、Tempvoice ダッシュボードへ — あなたのボイスチャンネルを管理・カスタマイズしよう。",
    "dashboard_create_link": "自分の声、自分の空間。今すぐ始めよう: https://discord.com/channels/{guildId}/{channelId}",
    "dashboard_footer": "下のボタンでチャンネルを管理できます。",
    "name_desc": "ボイスチャンネルの名前を変更",
    "limit_desc": "チャンネルのユーザー上限を設定",
    "privacy_desc": "チャンネルのプライバシー設定を変更",
    "dnd_desc": "「取り込み中」モードをオン/オフ",
    "region_desc": "ボイスチャンネルのリージョンを変更",
    "trust_desc": "特定ユーザーの参加を許可",
    "untrust_desc": "許可を取り消す",
    "block_desc": "ユーザーの閲覧・参加をブロック",
    "unblock_desc": "ブロックを解除してアクセスを復元",
    "bitrate_desc": "オーディオの音質を調整",
    "invite_desc": "ユーザーをボイスチャンネルに招待",
    "kick_desc": "選択したユーザーをチャンネルから退出させる",
    "claim_desc": "オーナーが不在なら、チャンネルを引き継ぐ",
    "transfer_desc": "他のユーザーにオーナー権を譲渡",
    "delete_desc": "一時的なボイスチャンネルを削除",
    "name": "名前",
    "limit": "上限",
    "privacy": "プライバシー",
    "dnd": "取り込み中",
    "region": "リージョン",
    "trust": "許可",
    "untrust": "取り消し",
    "block": "ブロック",
    "unblock": "解除",
    "bitrate": "ビットレート",
    "invite": "招待",
    "kick": "退出",
    "claim": "引き継ぐ",
    "transfer": "譲渡",
    "delete": "削除",

    // Delete
    "deleted": "チャンネルを削除しました。",
    "log_deleted": "{channel} を削除しました。",

    // DND
    "dnd_on": "取り込み中モードがオンになりました。他の人は入れますが、話したり操作できません。",
    "dnd_off": "取り込み中モードがオフになりました。他の人も話せるようになりました。",

    // Rename
    "invalid_name": "有効な名前を入力してください。",
    "channel_renamed": "チャンネル名を **{name}** に変更しました。",
    "log_renamed": "{user} がチャンネル名を {name} に変更しました。",

    // Limit
    "invalid_limit": "上限は1〜99の間で設定してください。",
    "limit_updated": "ユーザー上限を {limit} に変更しました。",
    "log_limit": "{user} が {channel} の上限を {limit} に設定しました。",

    // Claim
    "already_owner": "あなたはすでにこのチャンネルのオーナーです。",
    "owner_still_present": "現在のオーナーがまだチャンネルにいます。",
    "log_claimed": "{user} が {channel} のオーナーになりました。",

    // Trust
    "trust_option": "許可するユーザーを選んでください。",
    "trust_placeholder": "許可するユーザーを選択",
    "trusted": "{user} にアクセスを許可しました。今後は参加可能です。",
    "log_trust": "{user} が {channel} にアクセス許可されました。",

    // Untrust
    "untrust_option": "アクセスを取り消すユーザーを選んでください。",
    "untrust_placeholder": "取り消すユーザーを選択",
    "untrusted": "{user} のアクセスを取り消しました。もう参加できません。",
    "log_untrust": "{user} のアクセスが {channel} から取り消されました。",

    // Block
    "block_option": "ブロックするユーザーを選んでください。",
    "block_placeholder": "ブロックするユーザーを選択",
    "blocked": "{user} をこのチャンネルからブロックしました。",
    "log_block": "{user} が {channel} をブロックされました。",

    // Unblock
    "unblock_option": "ブロック解除するユーザーを選んでください。",
    "unblock_placeholder": "解除するユーザーを選択",
    "unblocked": "{user} のブロックを解除し、権限をリセットしました。",
    "log_unblock": "{user} のブロックが {channel} で解除されました。",

    // Transfer
    "transfer_option": "オーナーを譲渡する相手を選んでください。",
    "transfer_placeholder": "新しいオーナーを選択",
    "no_user_to_transfer": "チャンネルに他のメンバーがいません。",
    "log_transfer": "{user} が {channel} のオーナーになりました。",

    // Kick
    "kick_option": "退出させるユーザーを選んでください。",
    "kick_placeholder": "退出対象のユーザーを選択",
    "user_not_found": "チャンネル内にそのユーザーはいません。",
    "no_user_to_kick": "退出させるユーザーがいません。",
    "log_kick": "{user} が {channel} から退出させられました。",

    // Region
    "region_option": "リージョンを選んでください。",
    "region_placeholder": "リージョンを選択",
    "region_updated": "リージョンを {region} に更新しました。",
    "error_region": "リージョンの更新に失敗しました。",
    "log_region": "{user} が {channel} のリージョンを {region} に変更しました。",

    // Bitrate
    "bitrate_option": "ビットレートを選んでください。",
    "bitrate_placeholder": "音質を選択",
    "bitrate_updated": "ビットレートを {bitrate} kbps に設定しました。",
    "error_bitrate": "ビットレートの更新に失敗しました。",
    "log_bitrate": "{user} が {channel} のビットレートを {bitrate} kbps に変更しました。",

    // Invite
    "invite_option": "招待するユーザーを選んでください。",
    "invite_placeholder": "招待したいユーザーを選択",
    "invite_message": "{name} というボイスチャンネルに招待されました。\n{voiceLink}",
    "invited_user": "{user} を招待しました。",
    "error_send_invite": "ユーザーに招待を送れませんでした。",
    "error_user_dms_closed": "このユーザーにはDMが送れません。DMがオフか、Botかもしれません。",
    "log_invite": "{user} を {channel} に招待しました。",

    // Privacy
    "privacy_option": "プライバシー設定を変更する",
    "privacy_placeholder": "設定を選択",
    "privacy_lock_label": "ロック",
    "privacy_lock_desc": "信頼済みユーザーだけが参加可能",
    "privacy_lock": "チャンネルをロックしました。信頼済みユーザーのみが参加できます。",
    "privacy_unlock_label": "アンロック",
    "privacy_unlock_desc": "誰でも参加可能になります",
    "privacy_unlock": "チャンネルをアンロックしました。全員が参加できます。",
    "privacy_invisible_label": "非表示",
    "privacy_invisible_desc": "信頼ユーザーのみがチャンネルを見れます",
    "privacy_invisible": "このチャンネルは他の人から見えなくなりました。",
    "privacy_visible_label": "表示",
    "privacy_visible_desc": "チャンネルが全員に見えるようになります",
    "privacy_visible": "このチャンネルは全員に見えるようになりました。",
    "privacy_closechat_label": "チャットを閉じる",
    "privacy_closechat_desc": "信頼ユーザーのみがチャット可能",
    "privacy_closechat": "チャットを閉じました。信頼済みユーザーのみが送信できます。",
    "privacy_openchat_label": "チャットを開く",
    "privacy_openchat_desc": "誰でもメッセージを送れます",
    "privacy_openchat": "チャットを開放しました。",
    "log_privacy": "{user} が {channel} のプライバシーを {value} に変更しました。",

    // Voice State Update
    "log_left": "{user} が {channel} から退出しました。",
    "log_joined": "{user} が {channel} に参加しました。",
    "log_switched": "{user} が {from} から {to} に移動しました。",
    "log_channel_already_deleted": "{channel} はすでに削除されています。",
    "log_channel_delete_failed": "{channel} の削除に失敗しました。",

    // General messages
    "not_owner": "このチャンネルのオーナーではありません。",
    "invalid_user": "無効なユーザーです。もう一度お試しください。",
    "not_in_channel": "まだボイスチャンネルに参加していません。",
    "different_channel": "この機能は他のチャンネルでは使えません。",
    "permissions_updated": "{user} が {channel} の権限を更新しました。",
    "log_send_failed": "ログ送信に失敗しました: {error}",
    "missing_lang_key": "翻訳キーが見つかりません: {key}",
    "failed_load_modal": "モーダルの読み込みに失敗しました: {file}",
    "interaction_timeout": "操作がタイムアウトしました。",
    "error_interaction": "エラーが発生しました。しばらくしてからお試しください。",
    "interaction_already_active": "すでにアクティブな操作があります。先にそれを完了してください。",
    "invalid_category": "CATEGORY_CHANNEL_ID は無効か、カテゴリではありません。",
    "invalid_embed": "EMBED_CHANNEL_ID は無効か、テキストチャンネルではありません。",
    "invalid_voice": "VOICE_CHANNEL_ID は無効か、ボイスチャンネルではありません。",

  "rate_limit_exceeded": "操作が頻繁すぎます。しばらくお待ちください。",
  "cannot_trust_self": "自分自身を信頼することはできません。",
  "cannot_untrust_self": "自分自身の信頼を取り消すことはできません。",
  "cannot_block_self": "自分自身をブロックすることはできません。", 
  "cannot_invite_self": "自分自身を招待することはできません。",
  "cannot_kick_self": "自分自身をキックすることはできません。",
  "cannot_transfer_to_self": "自分自身に所有権を譲渡することはできません。",
  "cannot_block_admin": "サーバー管理者をブロックすることはできません。",
  "cannot_kick_admin": "サーバー管理者をキックすることはできません。",
  "cannot_kick_higher_role": "より高い役職のユーザーをキックすることはできません。",
  "cannot_transfer_to_bot": "ボットに所有権を譲渡することはできません。",
  "user_not_blocked": "{user}はブロックされていません。",
  "user_already_in_channel": "{user}は既にこのチャンネルにいます。",
  "cannot_invite_blocked_user": "ブロックされたユーザーを招待することはできません。",
  "error_create_invite": "招待リンクの作成に失敗しました。",
  "kick_failed": "{user}のキックに失敗しました。",
  "transfer_failed": "所有権の譲渡に失敗しました。",
  "invalid_bitrate": "無効なビットレートが選択されました。",
  "invalid_region": "無効な地域が選択されました。",
  "ownership_transferred_dm": "あなたは{guild}の音声チャンネル'{channel}'の所有者になりました。{from}から譲渡されました。",
  "log_dnd": "{user}が{channel}で取り込み中モードを{status}しました。",
  "log_trust": "{user}が{by}によって{channel}で信頼されました。",
  "log_untrust": "{user}の信頼が{by}によって{channel}で取り消されました。",
  "log_block": "{user}が{by}によって{channel}からブロックされました。",
  "log_unblock": "{user}が{by}によって{channel}でブロック解除されました。",
  "log_invite": "{user}が{by}によって{channel}に招待されました。",
  "log_kick": "{user}が{by}によって{channel}からキックされました。",
  "log_transfer": "{channel}の所有権が{from}から{user}に譲渡されました。",
  "permissions_restored": "{user}の{channel}での所有者権限が復元されました。"
}

export default jp
