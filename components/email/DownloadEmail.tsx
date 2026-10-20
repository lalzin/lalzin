/**
 * Email transactionnel « tes plugins Groove Knobs ».
 * React Email, aux couleurs du site (fond nuit, crème, magenta → corail).
 * Les clients mail ignorent le CSS externe : tout est en style inline.
 */
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { Lang } from '@/lib/content';
import { OS_LABEL, type OS, type Plugin } from '@/lib/plugins';

export type DownloadEmailProps = {
  lang: Lang;
  siteUrl: string;
  /** Un bloc par plugin, avec un lien par OS disponible. */
  items: {
    plugin: Plugin;
    image: string;
    links: { os: OS; href: string; size: string }[];
  }[];
  installUrl: string;
  /** Profil Instagram, ou null si absent du contenu du site. */
  instagramUrl: string | null;
  paypalUrl: string | null;
  bookingEmail: string;
};

const NIGHT = '#160912';
const NIGHT_SOFT = '#2C1726';
const CREAM = '#F5E8CF';
const GOLD = '#E9AE3E';
const MAGENTA = '#E8487E';
const CORAL = '#EE6C3A';

const T = {
  fr: {
    preview: 'Tes liens de téléchargement Groove Knobs.',
    hello: 'Et voilà 🎛️',
    intro: 'Tes plugins sont prêts. Les liens restent valables 7 jours.',
    on: 'pour',
    installTitle: 'Première installation ?',
    installText: 'Deux minutes, et le knob est dans ton DAW :',
    installCta: 'Voir le guide d’installation',
    followTitle: 'Reste dans la boucle',
    followText: 'Les nouveaux plugins sont annoncés sur Instagram.',
    followCta: 'Suivre LALZIN',
    donate: 'Ces plugins sont gratuits. Si tu veux soutenir la suite, c’est par ici, en toute liberté.',
    donateCta: 'Offrir un café',
    reply: 'Un souci, une idée ? Réponds simplement à cet email.',
    signature: 'by LALZIN, with groove and love',
    transactional: 'Tu reçois cet email parce que tu as demandé ces plugins sur',
  },
  en: {
    preview: 'Your Groove Knobs download links.',
    hello: 'Here you go 🎛️',
    intro: 'Your plugins are ready. The links stay valid for 7 days.',
    on: 'for',
    installTitle: 'First install?',
    installText: 'Two minutes, and the knob is in your DAW:',
    installCta: 'Read the install guide',
    followTitle: 'Stay in the loop',
    followText: 'New plugins get announced on Instagram.',
    followCta: 'Follow LALZIN',
    donate: 'These plugins are free. If you want to support the next ones, it’s right here, entirely up to you.',
    donateCta: 'Buy me a coffee',
    reply: 'A problem, an idea? Just reply to this email.',
    signature: 'by LALZIN, with groove and love',
    transactional: 'You are getting this email because you requested these plugins on',
  },
} as const;

export default function DownloadEmail({
  lang,
  siteUrl,
  items,
  installUrl,
  instagramUrl,
  paypalUrl,
  bookingEmail,
}: DownloadEmailProps) {
  const t = T[lang];

  return (
    <Html lang={lang}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ backgroundColor: NIGHT, margin: 0, padding: '24px 0', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px' }}>
          <Text style={{ color: CREAM, fontSize: '26px', fontWeight: 800, margin: '0 0 4px' }}>LALZIN</Text>
          <Text style={{ color: GOLD, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 24px' }}>
            Groove Knobs
          </Text>

          <Text style={{ color: CREAM, fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>{t.hello}</Text>
          <Text style={{ color: `${CREAM}b3`, fontSize: '15px', lineHeight: '24px', margin: '0 0 28px' }}>{t.intro}</Text>

          {items.map(({ plugin, image, links }) => (
            <Section
              key={plugin.slug}
              style={{
                backgroundColor: NIGHT_SOFT,
                borderRadius: '18px',
                padding: '18px',
                marginBottom: '18px',
              }}
            >
              <Img
                src={image}
                alt={plugin.name}
                width="512"
                height="269"
                style={{ width: '100%', height: 'auto', borderRadius: '12px', marginBottom: '14px' }}
              />
              <Text style={{ color: CREAM, fontSize: '18px', fontWeight: 700, margin: '0 0 2px' }}>
                {plugin.name}
              </Text>
              <Text style={{ color: `${CREAM}80`, fontSize: '13px', margin: '0 0 16px' }}>
                {plugin.tagline[lang]} · v{plugin.version}
              </Text>

              {links.map((l) => (
                <Button
                  key={l.os}
                  href={l.href}
                  style={{
                    display: 'block',
                    backgroundColor: MAGENTA,
                    backgroundImage: `linear-gradient(90deg, ${MAGENTA}, ${CORAL})`,
                    color: NIGHT,
                    fontSize: '15px',
                    fontWeight: 700,
                    textAlign: 'center',
                    textDecoration: 'none',
                    padding: '13px 20px',
                    borderRadius: '999px',
                    marginBottom: '8px',
                  }}
                >
                  {`${plugin.name} ${t.on} ${OS_LABEL[l.os]} · ${l.size}`}
                </Button>
              ))}
            </Section>
          ))}

          <Section style={{ padding: '6px 2px 0' }}>
            <Text style={{ color: CREAM, fontSize: '15px', fontWeight: 700, margin: '14px 0 4px' }}>
              {t.installTitle}
            </Text>
            <Text style={{ color: `${CREAM}b3`, fontSize: '14px', lineHeight: '22px', margin: '0 0 6px' }}>
              {t.installText}{' '}
              <Link href={installUrl} style={{ color: GOLD }}>
                {t.installCta}
              </Link>
            </Text>
          </Section>

          {instagramUrl && (
            <Section style={{ padding: '6px 2px' }}>
              <Hr style={{ borderColor: `${CREAM}1a`, margin: '18px 0' }} />
              <Text style={{ color: CREAM, fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>
                {t.followTitle}
              </Text>
              <Text style={{ color: `${CREAM}b3`, fontSize: '14px', lineHeight: '22px', margin: '0 0 6px' }}>
                {t.followText}{' '}
                <Link href={instagramUrl} style={{ color: GOLD, fontWeight: 700 }}>
                  {t.followCta} →
                </Link>
              </Text>
            </Section>
          )}

          {paypalUrl && (
            <Section style={{ padding: '6px 2px' }}>
              <Hr style={{ borderColor: `${CREAM}1a`, margin: '18px 0' }} />
              <Text style={{ color: `${CREAM}99`, fontSize: '13px', lineHeight: '21px', margin: '0 0 6px' }}>
                {t.donate}
              </Text>
              <Link href={paypalUrl} style={{ color: GOLD, fontSize: '13px', fontWeight: 700 }}>
                {t.donateCta} →
              </Link>
            </Section>
          )}

          <Hr style={{ borderColor: `${CREAM}1a`, margin: '22px 0 14px' }} />

          <Text style={{ color: `${CREAM}80`, fontSize: '13px', lineHeight: '21px', margin: '0 0 10px' }}>
            {t.reply}{' '}
            <Link href={`mailto:${bookingEmail}`} style={{ color: GOLD }}>
              {bookingEmail}
            </Link>
          </Text>
          <Text style={{ color: GOLD, fontSize: '13px', fontStyle: 'italic', margin: '0 0 14px' }}>
            {t.signature}
          </Text>
          <Text style={{ color: `${CREAM}4d`, fontSize: '11px', lineHeight: '18px', margin: 0 }}>
            {t.transactional}{' '}
            <Link href={siteUrl} style={{ color: `${CREAM}66` }}>
              {siteUrl.replace(/^https?:\/\//, '')}
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/** Version texte (obligatoire pour la délivrabilité et les clients sans HTML). */
export function downloadEmailText(props: DownloadEmailProps): string {
  const { lang, items, installUrl, instagramUrl, paypalUrl, bookingEmail, siteUrl } = props;
  const t = T[lang];
  const lines: string[] = [t.hello, '', t.intro, ''];

  for (const { plugin, links } of items) {
    lines.push(`${plugin.name} : ${plugin.tagline[lang]} (v${plugin.version})`);
    for (const l of links) lines.push(`  ${OS_LABEL[l.os]} (${l.size}) : ${l.href}`);
    lines.push('');
  }

  lines.push(`${t.installTitle} ${installUrl}`, '');
  if (instagramUrl) lines.push(`${t.followText} ${instagramUrl}`, '');
  if (paypalUrl) lines.push(t.donate, paypalUrl, '');
  lines.push(`${t.reply} ${bookingEmail}`, '', t.signature, '', `${t.transactional} ${siteUrl}.`);
  return lines.join('\n');
}
