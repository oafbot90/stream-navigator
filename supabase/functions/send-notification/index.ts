
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_audience: 'all' | 'premium' | 'vip' | 'active' | 'expired';
  admin_id: string;
  admin_email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      title, 
      message, 
      type, 
      target_audience, 
      admin_id, 
      admin_email 
    }: NotificationRequest = await req.json()

    console.log('Enviando notificação:', { title, type, target_audience, admin_email });

    // Verificar se o usuário é admin
    const adminEmails = ['alezin1788@gmail.com', 'admin@flixhub.com'];
    if (!adminEmails.includes(admin_email)) {
      throw new Error('Acesso negado: usuário não é administrador');
    }

    // Buscar usuários baseado no público-alvo
    let usersQuery;
    
    switch (target_audience) {
      case 'all':
        // Buscar todos os usuários
        const { data: allUsers } = await supabaseClient.auth.admin.listUsers();
        usersQuery = allUsers.users;
        break;
        
      case 'premium':
        const { data: premiumSubs } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('plano', 'premium')
          .eq('status', 'ativo');
        
        if (premiumSubs) {
          const userIds = premiumSubs.map(sub => sub.user_id);
          const { data: premiumUsers } = await supabaseClient.auth.admin.listUsers();
          usersQuery = premiumUsers.users.filter(user => userIds.includes(user.id));
        }
        break;
        
      case 'vip':
        const { data: vipSubs } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('plano', 'vip')
          .eq('status', 'ativo');
        
        if (vipSubs) {
          const userIds = vipSubs.map(sub => sub.user_id);
          const { data: vipUsers } = await supabaseClient.auth.admin.listUsers();
          usersQuery = vipUsers.users.filter(user => userIds.includes(user.id));
        }
        break;
        
      case 'active':
        const { data: activeSubs } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('status', 'ativo');
        
        if (activeSubs) {
          const userIds = activeSubs.map(sub => sub.user_id);
          const { data: activeUsers } = await supabaseClient.auth.admin.listUsers();
          usersQuery = activeUsers.users.filter(user => userIds.includes(user.id));
        }
        break;
        
      case 'expired':
        const { data: expiredSubs } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('status', 'vencido');
        
        if (expiredSubs) {
          const userIds = expiredSubs.map(sub => sub.user_id);
          const { data: expiredUsers } = await supabaseClient.auth.admin.listUsers();
          usersQuery = expiredUsers.users.filter(user => userIds.includes(user.id));
        }
        break;
        
      default:
        const { data: defaultUsers } = await supabaseClient.auth.admin.listUsers();
        usersQuery = defaultUsers.users;
    }

    if (!usersQuery || usersQuery.length === 0) {
      console.log('Nenhum usuário encontrado, enviando para canal global');
      usersQuery = [{ id: 'global' }];
    }

    // Criar notificação
    const notification = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      target_audience,
      admin_id,
      read: false,
      date: new Date().toISOString()
    };

    console.log('Notificação criada:', notification);

    // Enviar via broadcast para canal global (alcança todos os usuários online)
    const globalChannel = supabaseClient.channel('global-notifications');
    
    try {
      await globalChannel.send({
        type: 'broadcast',
        event: 'new-notification',
        payload: notification
      });
      console.log('Notificação enviada via canal global');
    } catch (error) {
      console.error('Erro ao enviar via canal global:', error);
    }

    // Enviar também para canais específicos de usuários como backup
    let sentCount = 0;
    for (const user of usersQuery) {
      if (user.id === 'global') continue;
      
      try {
        // Salvar notificação no localStorage simulado para persistência offline
        const userChannel = supabaseClient.channel(`user-notifications-${user.id}`);
        await userChannel.send({
          type: 'broadcast',
          event: 'new-notification',
          payload: notification
        });

        // Persistir notificação para usuários offline
        try {
          const existingNotifications = [];
          try {
            // Tentar recuperar notificações existentes (simulado via metadados do usuário)
            const { data: userData } = await supabaseClient.auth.admin.getUserById(user.id);
            if (userData.user?.user_metadata?.offline_notifications) {
              existingNotifications.push(...userData.user.user_metadata.offline_notifications);
            }
          } catch (e) {
            console.log('Usuário sem notificações offline anteriores');
          }

          // Adicionar nova notificação
          existingNotifications.unshift(notification);
          
          // Manter apenas as últimas 50 notificações para não sobrecarregar
          const limitedNotifications = existingNotifications.slice(0, 50);

          // Buscar dados atuais do usuário antes de atualizar
          const { data: currentUserData } = await supabaseClient.auth.admin.getUserById(user.id);

          // Salvar no metadados do usuário para persistência offline
          await supabaseClient.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...currentUserData?.user?.user_metadata,
              offline_notifications: limitedNotifications,
              last_notification_update: new Date().toISOString()
            }
          });

          console.log(`Notificação persistida para usuário offline ${user.id}`);
        } catch (persistError) {
          console.error(`Erro ao persistir notificação para usuário ${user.id}:`, persistError);
        }

        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar para usuário ${user.id}:`, error);
      }
    }

    console.log(`Notificação enviada para ${sentCount} usuários específicos + canal global + persistência offline`);

    return new Response(
      JSON.stringify({
        success: true,
        users_count: Math.max(sentCount, usersQuery.length),
        message: `Notificação enviada com sucesso para ${Math.max(sentCount, usersQuery.length)} usuários (incluindo offline)`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro em send-notification:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
