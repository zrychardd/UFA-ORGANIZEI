import { useState } from 'react'
import { X } from 'lucide-react'
import Modal from './Modal'

// ATENÇÃO (responsável pelo projeto): estes textos são um MODELO escrito para o UFA Organizei com base
// em boas práticas e na LGPD (Lei 13.709/2018). Revise com quem entende de direito digital antes de
// divulgar o app amplamente, e ajuste o contato, o que o projeto realmente coleta e os prazos.
export const SUPPORT_EMAIL = 'rychardeduardos@gmail.com'
export const TERMS_VERSION = '2026-11-15'
const LAST_UPDATE = '15 de novembro de 2026'

const TERMS = [
  ['1. Sobre o serviço', ['O UFA Organizei é uma plataforma gratuita para estudantes organizarem tarefas, agenda, hábitos, disciplinas, materiais e acompanharem notícias e avisos do campus.', 'É um projeto independente, sem vínculo oficial com a UFABC. As informações acadêmicas exibidas (como CR, CA e limite de faltas) são estimativas feitas a partir do que você informa e não substituem os sistemas e documentos oficiais da universidade.']],
  ['2. Quem pode usar', ['Para criar uma conta é preciso ter 16 anos ou mais e informar dados verdadeiros. Cada pessoa deve ter uma única conta e é responsável por manter a senha em segurança.']],
  ['3. Regras de convivência no Feed', ['O Feed é um mural coletivo visível para todos os usuários logados. Não é permitido publicar conteúdo ofensivo, discriminatório, ameaçador, ilegal, enganoso ou com spam, nem divulgar dados pessoais de terceiros sem autorização.', 'Você pode denunciar publicações pelo menu "•••". Podemos remover conteúdos e suspender contas que violem estas regras, sem aviso prévio nos casos graves.']],
  ['4. Conteúdo que você publica', ['O que você escreve e envia continua sendo seu. Ao publicar no Feed, você nos autoriza a exibir esse conteúdo aos demais usuários dentro da plataforma, enquanto ele estiver publicado. Você é responsável pelo que publica.', 'Seus materiais e anexos são privados e só aparecem para você. Envie apenas arquivos que você tem direito de guardar.']],
  ['5. Disponibilidade e mudanças', ['Fazemos o possível para manter o serviço no ar, mas ele é oferecido "como está", sem garantia de funcionamento ininterrupto. Podemos alterar, suspender ou encerrar funcionalidades. Mantenha cópias dos seus dados importantes.']],
  ['6. Limitação de responsabilidade', ['Não nos responsabilizamos por decisões acadêmicas tomadas com base nas informações da plataforma, nem por perdas decorrentes de indisponibilidade, falhas ou uso indevido da conta por terceiros. Confira sempre prazos e notas nos canais oficiais da UFABC.']],
  ['7. Encerramento', ['Você pode excluir sua conta a qualquer momento em Configurações > Segurança > Excluir conta. Também podemos suspender ou encerrar contas que descumpram estes Termos.']],
  ['8. Alterações destes Termos', ['Podemos atualizar estes Termos. Quando a mudança for relevante, avisaremos na plataforma. Continuar usando o serviço depois do aviso significa que você concorda com a nova versão.']],
  ['9. Contato', [`Dúvidas, denúncias ou pedidos: ${SUPPORT_EMAIL}.`]],
]

const PRIVACY = [
  ['1. Quem é o responsável', [`O UFA Organizei é mantido por seu desenvolvedor, responsável pelo tratamento dos dados descritos aqui. Contato para assuntos de privacidade: ${SUPPORT_EMAIL}.`]],
  ['2. Quais dados tratamos', ['Conta: e-mail e senha (a senha é guardada de forma criptografada pelo serviço de autenticação, nunca em texto aberto).', 'Perfil: nome de usuário e, se você quiser informar, nome completo, curso e ano de ingresso.', 'Conteúdo que você cria: tarefas, anexos e materiais, eventos, hábitos e registros de tempo, disciplinas, notas e faltas, publicações, comentários, curtidas e denúncias.', 'Dados técnicos: registros básicos de acesso mantidos pelos provedores de hospedagem e segurança. Guardamos no seu aparelho o tema escolhido e suas preferências de lembretes. Não usamos cookies de publicidade nem rastreadores de terceiros.']],
  ['3. Para que usamos', ['Para fornecer o serviço (salvar e mostrar o que você cadastra), manter a segurança e prevenir abusos, moderar o Feed e melhorar a plataforma. Não vendemos seus dados e não os usamos para publicidade.']],
  ['4. Bases legais (LGPD)', ['Execução do serviço que você solicitou ao criar a conta; legítimo interesse para segurança e prevenção de fraudes e abusos; e seu consentimento para recursos opcionais, como as notificações do navegador, que você pode desligar quando quiser.']],
  ['5. Com quem os dados são compartilhados', ['Usamos provedores para operar o serviço: Supabase (autenticação, banco de dados e armazenamento de arquivos) e Vercel (hospedagem do site). As notícias exibidas vêm de fontes públicas e podem ser resumidas por inteligência artificial; nenhum dado de usuário é enviado nesse processo.', 'Seu nome de usuário e suas publicações no Feed são visíveis aos demais usuários logados. Tarefas, eventos, hábitos, disciplinas, notas e materiais são privados e só aparecem para você. Poderemos divulgar dados se houver obrigação legal.']],
  ['6. Onde os dados ficam', ['Os provedores podem armazenar dados em servidores fora do Brasil. Nesses casos, buscamos provedores que adotem medidas de segurança adequadas.']],
  ['7. Por quanto tempo guardamos', ['Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a conta, seus dados e arquivos são apagados; cópias de segurança podem levar um período limitado para serem eliminadas.']],
  ['8. Seus direitos', ['Pela LGPD, você pode pedir confirmação do tratamento, acesso, correção, eliminação dos dados, portabilidade, informações sobre compartilhamento e revogar consentimentos.', `Você pode corrigir seus dados em Configurações e excluir sua conta em Configurações > Segurança. Para qualquer outro pedido, escreva para ${SUPPORT_EMAIL}.`]],
  ['9. Segurança', ['Usamos conexão criptografada e regras de acesso que isolam os dados de cada usuário. Nenhum sistema é totalmente imune a falhas; por isso, use uma senha forte e não a compartilhe.']],
  ['10. Menores de idade', ['O serviço é destinado a pessoas com 16 anos ou mais. Se identificarmos uma conta fora desse critério, ela poderá ser encerrada.']],
  ['11. Alterações desta Política', ['Esta Política pode ser atualizada. A data da última revisão aparece no topo e mudanças relevantes serão avisadas na plataforma.']],
]

const DOCS = {
  terms: { label: 'Termos de Uso', sections: TERMS },
  privacy: { label: 'Política de Privacidade', sections: PRIVACY },
}

export default function LegalModal({ initialDoc = 'terms', onClose }) {
  const [doc, setDoc] = useState(initialDoc)
  const { sections } = DOCS[doc]

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl" labelledBy="legal-title">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 id="legal-title" className="text-[15px] font-bold text-[#1a2e26] dark:text-gray-100">{DOCS[doc].label}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">UFA Organizei · Atualizado em {LAST_UPDATE}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
      </div>

      <div className="flex gap-2 mb-5" role="tablist">
        {Object.entries(DOCS).map(([key, item]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={doc === key}
            onClick={() => setDoc(key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${doc === key
              ? 'bg-[#00674F] text-white border-[#00674F]'
              : 'border-[#e4e9e6] dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-[#f0f5f2] dark:hover:bg-gray-800'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
        {sections.map(([heading, paragraphs]) => (
          <section key={heading}>
            <h4 className="text-[13px] font-bold text-[#1a2e26] dark:text-gray-100 mb-1.5">{heading}</h4>
            <div className="space-y-2">
              {paragraphs.map((text, i) => (
                <p key={i} className="text-xs text-[#5a6b63] dark:text-gray-300 leading-relaxed">{text}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex justify-end mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onClose} className="px-5 py-2 bg-[#00674F] hover:bg-[#005240] text-white rounded-xl text-xs font-bold transition-colors">Entendi</button>
      </div>
    </Modal>
  )
}
