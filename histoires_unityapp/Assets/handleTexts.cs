using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class handleTexts : MonoBehaviour
{
    public OSC osc;
    public GameObject testText;
    public GameObject outputbox;
    public GameObject templatePhrase;

    string PhraseResult = "";
    bool phraseReady = false;
    bool sourcesReady = false;
    List<List<string>> sourceWordsInPhrase;
    List<string> fullSourcePhrases;

    // Start is called before the first frame update
    void Start()
    {
        osc = GameObject.Find("oscinput").GetComponent<OSC>();

        // RECEIVE
        osc.SetAddressHandler("/ritaresult", GotResult);
        osc.SetAddressHandler("/ritasources", GotSources);
        osc.SetAddressHandler("/finaltranscript", GotFinalTranscript);
        osc.SetAddressHandler("/livetranscript", GotLiveTranscript);

    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void GotResult(OscMessage message)
    {
        string mess = message.ToString();
        // remove header 
        mess = mess.Substring(mess.IndexOf(" "), mess.Length);
        //phraseReady = true;
        PhraseResult = mess;

        Debug.Log("Phrase: " + mess);
    }

    void GotSources(OscMessage message)
    {
        string mess = message.ToString();
        // remove header 
        mess = mess.Substring(mess.IndexOf(" "), mess.Length);
        string[] sources = mess.Split('#');

        sourceWordsInPhrase = new List<List<string>>();
        fullSourcePhrases = new List<string>();

        for(int i=0; i<sources.Length; i++)
        {
            string[] src = sources[i].Split('@');
            sourceWordsInPhrase.Add(new List<string>(src[0].Split(' ')));
            fullSourcePhrases.Add(src[1]);
        }

        //sourcesReady = true;
        
    }

    void GotFinalTranscript(OscMessage message)
    {
        string mess = message.ToString();
        mess = mess.Substring(mess.IndexOf(" "), mess.Length);
    }

    void GotLiveTranscript(OscMessage message)
    {
        string mess = message.ToString();
        mess = mess.Substring(mess.IndexOf(" "), mess.Length);
    }

    void PutTextOnTracks()
    {

    }

    void GotText(OscMessage message)
    {
        /*
        string mess = message.ToString();
        string[] split = mess.Split((char)' ');
        mess = split[1];
        Debug.Log(mess);
        TMPro.TMP_Text tm = testText.GetComponent<TMPro.TMP_Text>();
        Debug.Log(tm);
        tm.text = mess;
        */
    }

    // SEND 
    /*
     * 
     OscMessage message = new OscMessage();

    message.address = "/UpdateXYZ";
    message.values.Add(transform.position.x);
    message.values.Add(transform.position.y);
    message.values.Add(transform.position.z);
    osc.Send(message);
     * */
}
