using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class handleTexts : MonoBehaviour
{
    public OSC osc;
    public GameObject testText;
    public GameObject outputbox;
    public GameObject templatePhrase;
    public GameObject LineGroups;

    public GameObject text1;
    public GameObject text2;

    string PhraseResult = "";
    List<List<string>> sourceWordsInPhrase = new List<List<string>>();
    List<string> fullSourcePhrases = new List<string>();

    List<string> queue;
    float InputInterval = 1.5f;
    float nextTrigger = 0f;
    List<int> RandomMemory = new List<int>();

    public List<bool> TrackIsFree = new List<bool>();

    int currentLineSet = 0;

    // Start is called before the first frame update
    void Start()
    {
        queue = new List<string>();

        osc = GameObject.Find("osc_input").GetComponent<OSC>();

        // RECEIVE
        osc.SetAddressHandler("/ritaresult", GotResult);
        osc.SetAddressHandler("/ritasources", GotSources);
        osc.SetAddressHandler("/finaltranscript", GotFinalTranscript);
        osc.SetAddressHandler("/livetranscript", GotLiveTranscript);
        osc.SetAddressHandler("/randomRecording", GotPrompt);
        osc.SetAddressHandler("/latestRecording", GotPrompt);

        SetCurrentLineSet(0);
    }

    void SetCurrentLineSet(int input)
    {
        currentLineSet = input;
        TrackIsFree = new List<bool>();

        Transform[] children = GetComponentsInDirectChildren(LineGroups.transform);
        
        GameObject LineSet = children[currentLineSet].gameObject;
        
        Transform[] Lines = GetComponentsInDirectChildren(LineSet.transform);

        for(int i=0; i<Lines.Length; i++)
        {
            TrackIsFree.Add(true);
        }
    }

    // Update is called once per frame
    void FixedUpdate()
    {
        if(Time.time > nextTrigger)
        {

            if (queue.Count > 0)
            {
                bool worked = PutTextOnTracks(queue[0]);

                if (worked)
                {
                    queue.RemoveAt(0);
                }
                
                nextTrigger = Time.time + InputInterval;
            }
            else if (fullSourcePhrases.Count > 0)
            {
                // format string to color code elements? euh
                //
                //
                // hmmm gotta pass a list of string indeces that correspond
                // to colored characters i guess?
                //
                // the charHandler script on each char object has a public 
                // method called updatecolor(material). Pass a material as 
                // argument to set color..........................
                string output = fullSourcePhrases[0];
                bool worked = PutTextOnTracks(output);
                if (worked)
                {
                    fullSourcePhrases.RemoveAt(0);
                    sourceWordsInPhrase.RemoveAt(0);
                }
                
                nextTrigger = Time.time + InputInterval;
            }
        }
    }

    void GotPrompt (OscMessage message)
    {
        string mess = message.ToString();
        
        // remove header 
        int pos = mess.IndexOf(" ");
        mess = mess.Substring(pos, mess.Length - pos);
        //phraseReady = true;
        PhraseResult = mess;

        Debug.Log("Phrase: " + mess);
        QueueText(PhraseResult);

        text1.GetComponent<UnityEngine.UI.Text>().text = mess;
    }

    void GotResult(OscMessage message)
    {
        string mess = message.ToString();

        // remove header 
        int pos = mess.IndexOf(" ");
        mess = mess.Substring(pos, mess.Length-pos);
        //phraseReady = true;
        PhraseResult = mess;

        Debug.Log("Phrase: " + mess);
        QueueText(PhraseResult);

        text1.GetComponent<UnityEngine.UI.Text>().text = mess;
    }

    void GotSources(OscMessage message)
    {
        string mess = message.ToString();
        // remove header 
        int pos = mess.IndexOf(" ");
        mess = mess.Substring(pos, mess.Length - pos);
        string[] sources = mess.Split('#');

        //sourceWordsInPhrase = new List<List<string>>();
        //fullSourcePhrases = new List<string>();

        for(int i=0; i<sources.Length; i++)
        {
            string[] src = sources[i].Split('@');
            sourceWordsInPhrase.Add(new List<string>(src[0].Split(' ')));
            fullSourcePhrases.Add(src[1]);
        }

        //sourcesReady = true;
        
    }

    void QueueText(string input)
    {
        queue.Add(input);
    }

    void GotFinalTranscript(OscMessage message)
    {
        string mess = message.ToString();
        int pos = mess.IndexOf(" ");
        mess = mess.Substring(pos, mess.Length - pos);

        text2.GetComponent<UnityEngine.UI.Text>().text = mess;

        queue.Add(mess);
    }

    void GotLiveTranscript(OscMessage message)
    {
        string mess = message.ToString();
        int pos = mess.IndexOf(" ");
        mess = mess.Substring(pos, mess.Length - pos);

        text2.GetComponent<UnityEngine.UI.Text>().text = mess;

        // add messages during live transcripts??
        // sort of chaotic lol
        // queue.Add(mess);
    }

    bool PutTextOnTracks(string input)
    {
        bool worked = false;
        Transform[] children = GetComponentsInDirectChildren(LineGroups.transform);
        //int pick = Random.Range(0, children.Length);
        //Debug.Log("picked line set # " + pick+" from a choice of "+children.Length+" sets");
        GameObject LineSet = children[currentLineSet].gameObject;
        Debug.Log("line set: ");
        Debug.Log(LineSet.name);
        Transform[] Lines = GetComponentsInDirectChildren(LineSet.transform);

        int pick = PickAvailableTrack(Lines.Length);
        if (pick != -1)
        {
            GameObject chosenLine = Lines[pick].gameObject;

            Debug.Log("chosen line: ");
            Debug.Log(pick);
            Debug.Log(chosenLine.name);
            GameObject phrase = Instantiate(templatePhrase);
            worked = true;
            phraseHandler ph = phrase.GetComponent<phraseHandler>();
            ph.SetupPhrase(chosenLine, outputbox, input, pick);
        }


        return worked;
    }

    int PickAvailableTrack(int inputLength)
    {
        int pick = Random.Range(0, inputLength);

        bool roomavailable = false;
        Debug.Log(TrackIsFree.Count+" "+ inputLength);
        for(int i=0; i<inputLength; i++)
        {
            if (TrackIsFree[i] == true) roomavailable = true;
        }

        if (roomavailable)
        {
            while (TrackIsFree[pick] == false)
            {
                pick=Random.Range(0, inputLength);
            }

            TrackIsFree[pick] = false;
            return pick;
        }
        else return -1;
        
    }

    int DifferentRandomPick(int inputLength)
    {
        int result = Random.Range(0, inputLength );

        // memory max length should be one less than inputLength 
        while (RandomMemory.Count >= inputLength -1 && RandomMemory.Count>0)
            RandomMemory.RemoveAt(0);

        // remove any out of range entries in memory
        for(int i= RandomMemory.Count-1; i>=0; i--)
        {
            if (RandomMemory[i] >= inputLength)
                RandomMemory.RemoveAt(i);
        }

        // now look for a number that isn't in memory
        while (RandomMemory.Contains(result))
        {
            result = Random.Range(0, inputLength );
        }

        RandomMemory.Add(result);
        Debug.Log("input length: " + inputLength);
        Debug.Log("result: " + result);
        return result;
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

    // stole this from 
    //https://forum.unity.com/threads/quickly-retrieving-the-immediate-children-of-a-gameobject.39451/ 
    // thanks to users DreamTitan and PutridPleasure 
    // made just a couple of changes myself
    public Transform[] GetComponentsInDirectChildren(Transform parent)
    {
        List<Transform> tmpList = new List<Transform>();

        foreach (Transform transform in parent.transform)
        {
            Transform component;
            if ((component = transform.GetComponent<Transform>()) != null)
            {
                tmpList.Add(component);
            }
        }

        return tmpList.ToArray();

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
