import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const Datenschutz = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-container">
      <div className="legal-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Zurück
        </button>

        <h1>Datenschutzerklärung</h1>

        <section className="legal-section">
          <h2>1. Datenschutz auf einen Blick</h2>
          
          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
            passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
            persönlich identifiziert werden können.
          </p>

          <h3>Datenerfassung auf dieser Website</h3>
          <h4>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>
          <p>
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
            können Sie dem Impressum dieser Website entnehmen.
          </p>

          <h4>Wie erfassen wir Ihre Daten?</h4>
          <p>
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. 
            um Daten handeln, die Sie in ein Kontaktformular oder bei der Registrierung eingeben.
          </p>
          <p>
            Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere 
            IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder 
            Uhrzeit des Seitenaufrufs).
          </p>

          <h4>Wofür nutzen wir Ihre Daten?</h4>
          <p>
            Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. 
            Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
          </p>

          <h4>Welche Rechte haben Sie bezüglich Ihrer Daten?</h4>
          <p>
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
            gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung 
            oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt 
            haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Verantwortlicher</h2>
          <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
          <div className="info-block">
            <p><strong>cr-solutions GmbH</strong></p>
            <p>Brauereistraße 4</p>
            <p>5230 Mattighofen</p>
            <p>Österreich</p>
            <p><strong>E-Mail:</strong> <a href="mailto:office@cr-solutions.at">office@cr-solutions.at</a></p>
          </div>
          <p>
            Verantwortlicher ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen 
            über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, E-Mail-Adressen) 
            entscheidet.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Speicherdauer</h2>
          <p>
            Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben 
            Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein 
            berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, 
            werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung 
            Ihrer personenbezogenen Daten haben.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Ihre Rechte</h2>
          
          <h3>Auskunftsrecht</h3>
          <p>
            Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob betreffende Daten verarbeitet werden 
            und auf Auskunft über diese Daten sowie auf weitere Informationen und Kopie der Daten entsprechend 
            den gesetzlichen Vorgaben.
          </p>

          <h3>Recht auf Berichtigung</h3>
          <p>
            Sie haben das Recht, die Vervollständigung der Sie betreffenden Daten oder die Berichtigung der Sie 
            betreffenden unrichtigen Daten zu verlangen.
          </p>

          <h3>Recht auf Löschung</h3>
          <p>
            Sie haben das Recht, zu verlangen, dass betreffende Daten unverzüglich gelöscht werden, sofern einer 
            der gesetzlich vorgesehenen Gründe zutrifft und soweit die Verarbeitung nicht erforderlich ist.
          </p>

          <h3>Recht auf Einschränkung der Verarbeitung</h3>
          <p>
            Sie haben das Recht, die Einschränkung der Verarbeitung zu verlangen, wenn eine der gesetzlichen 
            Voraussetzungen gegeben ist.
          </p>

          <h3>Recht auf Datenübertragbarkeit</h3>
          <p>
            Sie haben das Recht, die Sie betreffenden personenbezogenen Daten, die Sie uns bereitgestellt haben, 
            in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
          </p>

          <h3>Widerrufsrecht</h3>
          <p>
            Sie haben das Recht, eine erteilte Einwilligung zur Verarbeitung personenbezogener Daten jederzeit 
            mit Wirkung für die Zukunft zu widerrufen.
          </p>

          <h3>Widerspruchsrecht</h3>
          <p>
            Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen 
            die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen.
          </p>

          <h3>Beschwerderecht bei einer Aufsichtsbehörde</h3>
          <p>
            Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren. In Österreich ist dies die 
            Datenschutzbehörde:
          </p>
          <div className="info-block">
            <p><strong>Österreichische Datenschutzbehörde</strong></p>
            <p>Barichgasse 40-42</p>
            <p>1030 Wien</p>
            <p>Telefon: +43 1 52 152-0</p>
            <p>E-Mail: <a href="mailto:dsb@dsb.gv.at">dsb@dsb.gv.at</a></p>
            <p>Website: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">www.dsb.gv.at</a></p>
          </div>
        </section>

        <section className="legal-section">
          <h2>5. Datenerfassung auf dieser Website</h2>

          <h3>Server-Log-Dateien</h3>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
            die Ihr Browser automatisch an uns übermittelt. Dies sind:
          </p>
          <ul>
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p>
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser 
            Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes 
            Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website.
          </p>

          <h3>Registrierung auf dieser Website</h3>
          <p>
            Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen zu nutzen. Die dazu 
            eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes. 
            Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben werden. Anderenfalls 
            werden wir die Registrierung ablehnen.
          </p>
          <p>
            Im Falle wichtiger Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen Änderungen nutzen 
            wir die bei der Registrierung angegebene E-Mail-Adresse, um Sie auf diesem Wege zu informieren.
          </p>
          <p>
            Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt zum Zwecke der Durchführung des 
            durch die Registrierung begründeten Nutzungsverhältnisses und ggf. zur Anbahnung weiterer Verträge 
            (Art. 6 Abs. 1 lit. b DSGVO).
          </p>
          <p>
            Die bei der Registrierung erfassten Daten werden von uns gespeichert, solange Sie auf dieser Website 
            registriert sind und werden anschließend gelöscht. Gesetzliche Aufbewahrungsfristen bleiben unberührt.
          </p>

          <h3>Kontaktformular / E-Mail-Kontakt</h3>
          <p>
            Wenn Sie uns per Kontaktformular oder E-Mail Anfragen zukommen lassen, werden Ihre Angaben aus dem 
            Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage 
            und für den Fall von Anschlussfragen bei uns gespeichert.
          </p>
          <p>
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage 
            mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen 
            erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse 
            an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Plugins und Tools</h2>

          <h3>Football-Data.org API</h3>
          <p>
            Diese Website nutzt die API von Football-Data.org zur Bereitstellung von Fußballdaten. Dabei werden 
            keine personenbezogenen Daten an Football-Data.org übermittelt. Die Datenabfrage erfolgt ausschließlich 
            serverseitig.
          </p>
          <p>
            Mehr Informationen finden Sie in der Datenschutzerklärung von Football-Data.org: 
            <a href="https://www.football-data.org/terms" target="_blank" rel="noopener noreferrer">
              https://www.football-data.org/terms
            </a>
          </p>

          <h3>Anthropic Claude AI</h3>
          <p>
            Diese Website nutzt die KI-Dienste von Anthropic (Claude) zur Bereitstellung von intelligenten 
            Suchfunktionen. Bei der Nutzung des AI-Assistenten werden Ihre Suchanfragen an Anthropic übermittelt. 
            Es werden keine personenbezogenen Daten wie Name oder E-Mail-Adresse übermittelt.
          </p>
          <p>
            Mehr Informationen finden Sie in der Datenschutzerklärung von Anthropic: 
            <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">
              https://www.anthropic.com/privacy
            </a>
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Hosting</h2>
          
          <h3>IONOS</h3>
          <p>
            Wir hosten unsere Website bei IONOS SE. Anbieter ist die IONOS SE, Elgendorfer Str. 57, 56410 
            Montabaur, Deutschland.
          </p>
          <p>
            Details entnehmen Sie der Datenschutzerklärung von IONOS: 
            <a href="https://www.ionos.de/terms-gtc/terms-privacy" target="_blank" rel="noopener noreferrer">
              https://www.ionos.de/terms-gtc/terms-privacy
            </a>
          </p>
          <p>
            Die Verwendung von IONOS erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein 
            berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer Website.
          </p>

          <h3>Auftragsverarbeitung</h3>
          <p>
            Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes 
            geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der 
            gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren 
            Weisungen und unter Einhaltung der DSGVO verarbeitet.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Cookies</h2>
          <p>
            Diese Website verwendet ausschließlich technisch notwendige Cookies zur Verwaltung Ihrer Sitzung 
            (Session). Diese Cookies werden automatisch gelöscht, wenn Sie Ihren Browser schließen.
          </p>
          <p>
            Die Speicherung von Cookies erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber 
            hat ein berechtigtes Interesse an der Speicherung von technisch notwendigen Cookies zur fehlerfreien 
            und optimierten Bereitstellung seiner Dienste.
          </p>
          <p>
            <strong>Folgende Cookies werden verwendet:</strong>
          </p>
          <ul>
            <li><strong>JWT Token:</strong> Zur Authentifizierung angemeldeter Benutzer (gespeichert im localStorage)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Datensicherheit</h2>
          <p>
            Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) in 
            Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird. 
            In der Regel handelt es sich dabei um eine 256-Bit-Verschlüsselung.
          </p>
          <p>
            Wir bedienen uns geeigneter technischer und organisatorischer Sicherheitsmaßnahmen, um Ihre Daten 
            gegen zufällige oder vorsätzliche Manipulationen, teilweisen oder vollständigen Verlust, Zerstörung 
            oder gegen den unbefugten Zugriff Dritter zu schützen.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Änderungen dieser Datenschutzerklärung</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung gelegentlich anzupassen, damit sie stets den 
            aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der 
            Datenschutzerklärung umzusetzen.
          </p>
          <p>
            <strong>Stand:</strong> November 2025
          </p>
        </section>

        <div className="info-block" style={{marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--gray-100)', borderRadius: '8px'}}>
          <p><strong>Kontakt bei Datenschutzfragen:</strong></p>
          <p>cr-solutions GmbH</p>
          <p>E-Mail: <a href="mailto:office@cr-solutions.at">office@cr-solutions.at</a></p>
        </div>
      </div>
    </div>
  );
};

export default Datenschutz;
